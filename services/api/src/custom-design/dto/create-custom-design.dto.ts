export class CreateCustomDesignDto {
  title!: string;
  description?: string;
  images?: string[];
  size!: string;
  color!: string;
  placement!: string;
  notes?: string;
}
