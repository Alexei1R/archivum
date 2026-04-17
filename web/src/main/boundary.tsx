import { CommandProvider } from "@/features/command"
import { Outlet } from "react-router-dom"

const CommandBoundary = () => {
    return (
        <CommandProvider>
            <Outlet />
        </CommandProvider>
    )
}
export { CommandBoundary }


