import { Inject, Injectable, OnDestroy, Optional, signal } from '@angular/core';
import { GetInpatientDTO } from '@libs/api-client';
import { BASE_PATH } from '@libs/api-client/variables';


@Injectable()
export class SseClientService implements OnDestroy {
  url = `/api/Sse/sse-endpoint`;

  public readonly message = signal<GetInpatientDTO[]>([]);
  private eventSource: EventSource;

  constructor( @Inject(BASE_PATH) basePath: string | string[]) {
    this.url = basePath + this.url;
    this.eventSource = new EventSource(this.url);

    this.eventSource.onmessage = (event) => {
      const patients = JSON.parse(event.data);
      let newArray: GetInpatientDTO[] = [];
      if (Array.isArray(patients)) {
        newArray = patients.map((pa: Record<string, any>) => {
          return transformKeysToLowercase(pa);
        });
      }
      // transformKeysToLowercase()
      this.message.set(newArray); // todo. need extract array from response
    };

    this.eventSource.onerror = (error) => {
      console.error(error);
      this.message.set([]);
    };

  }

  ngOnDestroy(): void {
    console.log("Sse client exited.");
    this.eventSource.close();
  }



}


export function transformKeysToLowercase<T extends Record<string, any>>(obj: T): Record<string, any> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    // Convert the first letter of the key to lowercase
    const newKey = key.charAt(0).toLowerCase() + key.slice(1);
    acc[newKey] = value;
    return acc;
  }, {} as Record<string, any>);
}
