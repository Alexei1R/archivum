import { z } from "zod";

const loginSchema = z.object({
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;
type LoginErrors = Partial<Record<keyof LoginValues, string>>;

const initialLoginValues: LoginValues = {
    email: "",
    password: "",
};

const getLoginErrors = (issues: z.core.$ZodIssue[]): LoginErrors => {
    const errors: LoginErrors = {};

    for (const issue of issues) {
        const field = issue.path[0] as keyof LoginValues | undefined;
        if (field) errors[field] = issue.message;
    }

    return errors;
};

export { getLoginErrors, initialLoginValues, loginSchema };
export type { LoginErrors, LoginValues };
