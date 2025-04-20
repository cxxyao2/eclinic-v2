export interface UserProfile {
  id: number | undefined | null;
  firstName: string | undefined | null;
  lastName: string | undefined | null;
  gender: string | undefined | null;
  age: number | undefined | null;
  specialty: string | undefined | null;
  phoneNumber: string | undefined | null;
  email: string | undefined | null;
  createdDate: Date | undefined | null;
}
