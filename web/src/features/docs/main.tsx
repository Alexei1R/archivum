import Loading from "@/shared/components/common/loading";
import React from "react";

const Main: React.FC = () => {
    return (
        <div className="flex flex-col space-y-10 h-full w-full items-center justify-center text-center gap-4">




            <h1 className="text-2xl font-bold">Welcome to CodeHelper</h1>
            <p className="text-muted-foreground">Your AI-powered coding assistant</p>

            {/* ul */}
            <ul className="text-left list-disc list-inside space-y-2">
                <li>Explore projects and manage your code efficiently.</li>
                <li>Use the AI editor to enhance your coding experience.</li>
                <li>Access comprehensive documentation for guidance.</li>
                <li>Customize your settings to suit your workflow.</li>
            </ul>


            <Loading overlay="fullscreen" size="md" />


        </div>
    );
};

export default Main;
