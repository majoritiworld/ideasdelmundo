import { z } from "zod";
import { formValidator } from "@/components/form/utils/form-validator";

export const contactSchema = z.object({
  name: formValidator.requiredString().max(100, { error: "maxLength" }),
  email: formValidator.requiredEmail(),
  // "forms.errors.minLength" is the full root-level path that FieldError resolves
  message: formValidator
    .requiredString()
    .min(10, { error: "forms.errors.minLength" })
    .max(1000, { error: "maxLength" }),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
