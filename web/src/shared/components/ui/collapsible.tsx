import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import type React from "react"


type CollapsibleProps = React.ComponentProps<typeof CollapsiblePrimitive.Root>
type CollapsibleTriggerProps = React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>
type CollapsibleContentProps = React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>

const CollapsibleRoot: React.FC<CollapsibleProps> = ({
    ...props
}) => {
    return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({
    ...props
}) => {
    return (
        <CollapsiblePrimitive.CollapsibleTrigger
            data-slot="collapsible-trigger"
            {...props}
        />
    )
}

const CollapsibleContent: React.FC<CollapsibleContentProps> = ({
    ...props
}) => {
    return (
        <CollapsiblePrimitive.CollapsibleContent
            data-slot="collapsible-content"
            {...props}
        />
    )
}



const Collapsible: React.FC<CollapsibleProps> & {
    Trigger: React.FC<CollapsibleTriggerProps>;
    Content: React.FC<CollapsibleContentProps>;
} = Object.assign(CollapsibleRoot, {
    Trigger: CollapsibleTrigger,
    Content: CollapsibleContent,
});


export { Collapsible };



