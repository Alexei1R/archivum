import { QueryClientProvider } from "@tanstack/react-query"
import { client } from "@/shared/services"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/shared/components"
import { AlertProvider } from "@/shared/providers"

interface ProvidersProps {
    children: React.ReactNode
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <QueryClientProvider client={client}>
            <ThemeProvider>
                <AlertProvider>
                    {children}
                </AlertProvider>
                <Toaster position="bottom-right" expand closeButton />
            </ThemeProvider>
        </QueryClientProvider>
    )
}

export default Providers
