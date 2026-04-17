import { Button } from "@/shared/components";
import type React from "react";



interface AuthProps {
    providers: string[];
    onSignIn?: (provider: string) => void;
}

const Auth: React.FC<AuthProps> = ({ providers, onSignIn }) => {


    return (
        <div className="flex flex-col items-center justify-center min-h-screen ">
            {
                providers.map((provider) => (

                    <Button
                        variant="outline"
                        className=" min-w-[260px] p-6 rounded-xl shrink-0  mb-4"
                        key={provider}
                        onClick={() => {
                            onSignIn?.(provider);
                        }}
                    >
                        Sign in with {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </Button>
                ))

            }



        </div>


    );
}

export { Auth };
