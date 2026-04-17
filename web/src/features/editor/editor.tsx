import { cn } from "@/shared/utils";

interface EditorProps extends React.HTMLAttributes<HTMLDivElement> {
}

const Editor: React.FC<EditorProps> = ({
    className,
    ...props
}) => {


    return (
        <div
            className={cn(
                "flex min-h-24 items-center bg-background border-b border-border",
                className
            )}
            {...props}
        >
            <div className="flex items-center gap-1 px-4">
                <span className="text-sm font-medium text-foreground mr-4">CAD Editor</span>

            </div>
        </div>
    );
};

export default Editor;
