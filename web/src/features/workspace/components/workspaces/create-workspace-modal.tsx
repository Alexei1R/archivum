import React from "react";
import { z } from "zod";

import { Button, Dialog, Input } from "@/shared/components";
import { useCreateWorkspace } from "../../hooks";
import { cn } from "@/shared/utils";

const workspaceSchema = z.object({
    name: z.string()
        .min(1, "Workspace name is required")
        .min(3, "Name must be at least 3 characters")
        .max(50, "Name must be less than 50 characters")
        .regex(/^[a-zA-Z0-9\s-_]+$/, "Only letters, numbers, spaces, hyphens and underscores allowed")
});

interface CreateWorkspaceModalProps {
    className?: string;
}

const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ className }) => {
    const { create, isLoading } = useCreateWorkspace();
    const [name, setName] = React.useState<string>("");
    const [validationError, setValidationError] = React.useState<string>("");

    const validateAndCreate = () => {
        try {
            const validatedData = workspaceSchema.parse({ name: name.trim() });
            setValidationError("");
            create(validatedData);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const messages = error.issues.map(i => i.message).join(", ");
                setValidationError(messages || "Invalid input");
            }
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
        if (validationError) setValidationError("");
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            validateAndCreate();
        }
    };

    return (
        <Dialog>
            <Dialog.Trigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "rounded-md h-8 bg-brand/35",
                        className
                    )}
                >
                    New Workspace
                </Button>
            </Dialog.Trigger>
            <Dialog.Content className="sm:max-w-md w-[90vw] rounded-2xl p-6">
                <Dialog.Title className="text-lg font-semibold">
                    Create New Workspace
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                    Choose a name for your new workspace.
                </Dialog.Description>

                <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="workspace-name" className="text-sm font-medium">
                            Workspace Name
                        </label>
                        <Input
                            id="workspace-name"
                            value={name}
                            onChange={handleNameChange}
                            onKeyPress={handleKeyPress}
                            placeholder="Enter workspace name"
                            className="w-full"
                            disabled={isLoading}
                        />
                    </div>

                    {validationError && (
                        <div className="text-red-500 text-sm p-2 rounded-md ">
                            {validationError}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Dialog.Close asChild>
                            <Button
                                variant="outline"
                                className="rounded-lg px-4"
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </Dialog.Close>


                        <Button
                            onClick={validateAndCreate}
                            disabled={isLoading}
                            variant="outline" className="rounded-md h-8 bg-brand/35"
                        >
                            {isLoading ? "Creating..." : "Create"}
                        </Button>
                    </div>
                </div>
            </Dialog.Content>
        </Dialog>
    );
};

export default CreateWorkspaceModal;
