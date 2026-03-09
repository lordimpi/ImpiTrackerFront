export interface CurrentUserDto {
  readonly userId: string;
  readonly email: string;
  readonly fullName?: string | null;
  readonly planCode: string;
  readonly planName: string;
  readonly maxGps: number;
  readonly usedGps: number;
  readonly roles?: readonly string[];
}
