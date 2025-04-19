import { UrlTree } from "@angular/router";

export type MenuItem = {
    icon: string;
    label: string;
    route?: string;
    subItems?: MenuItem[]
}
