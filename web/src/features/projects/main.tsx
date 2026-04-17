import { useIsMobile } from "@/shared/hooks";
import { Settings } from "lucide-react";
import React from "react";

const projects = [
    { name: "Project 1", description: "This is the first project" },
    { name: "Project 2", description: "This is the second project" },
    { name: "Project 3", description: "This is the third project" },
    { name: "Project 4", description: "This is the fourth project" },
    { name: "Project 5", description: "This is the fifth project" },
    { name: "Project 6", description: "This is the sixth project" },
    { name: "Project 7", description: "This is the seventh project" },
    { name: "Project 8", description: "This is the eighth project" },
    { name: "Project 9", description: "This is the ninth project" },
    { name: "Project 10", description: "This is the tenth project" },
    { name: "Project 11", description: "This is the eleventh project" },
    { name: "Project 12", description: "This is the twelfth project" },
];

const Main: React.FC = () => {



    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 overflow-y-auto">


            {projects.map((project, index) => (
                <Project key={index} name={project.name} description={project.description} />
            ))}
        </div>
    );
};

interface ProjectProps {
    name?: string;
    description?: string;
}

const Project: React.FC<ProjectProps> = ({
    name = "Nume project",
    description = "Descriere project",
}) => {
    return (
        <div className="bg-popover p-4 rounded-xl border border-border group flex flex-col justify-between max-w-sm">

            <div className="relative w-full h-32 bg-muted rounded-md mb-4 ">
                <div className="absolute right-2 top-2 hidden group-hover:block w-2.5 h-2.5 rounded-full bg-blue-500" />
            </div>


            <span className="text-lg font-semibold">{name}</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Settings className="w-5 h-5" />
                <p className="truncate">{description}</p>
            </div>
        </div>
    );
};

export default Main;
