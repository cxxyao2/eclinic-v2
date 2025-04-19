import { HttpErrorResponse, HttpInterceptorFn, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { BASE_PATH } from '@libs/api-client/variables';

// State for token refresh
let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const router = inject(Router);
  const baseURL = inject(BASE_PATH);

  const addTokenHeader = (request: typeof req, token: string) => {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  };

  const refreshToken = (): Observable<string> => {
    return http.post<{ accessToken: string }>(`${baseURL}/auth/refresh-token`, {}).pipe(
      switchMap((response) => {
        return new Observable<string>((observer) => {
          observer.next(response.accessToken);
          observer.complete();
        });
      })
    );
  };

  const handleAuthError = () => {
    localStorage.removeItem('accessToken');
    router.navigate(['/login']);
  };

  const handleExpiredToken = (request: typeof req) => {
    isRefreshing = true;

    return refreshToken().pipe(
      switchMap((newToken) => {
        isRefreshing = false;
        localStorage.setItem('accessToken', newToken);
        return next(addTokenHeader(request, newToken));
      }),
      catchError((error) => {
        isRefreshing = false;
        handleAuthError();
        return throwError(() => error);
      })
    );
  };

  const token = localStorage.getItem('accessToken');

  if (token) {
    // Check if token is expired
    const decodedToken: any = jwtDecode(token);
    const isExpired = decodedToken.exp * 1000 < Date.now();

    if (isExpired && !isRefreshing) {
      return handleExpiredToken(req);
    }

    req = addTokenHeader(req, token);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isRefreshing) {
        return handleExpiredToken(req);
      }
      return throwError(() => error);
    })
  );
}
