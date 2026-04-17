import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/shared/utils";

interface LoadingProps {
    message?: string;
    overlay?: "fullscreen" | "container" | "none";
    size?: "sm" | "md" | "lg";
    color?: string;
    show?: boolean;
}

const MYSTICAL_MESSAGES = [
    "Decoding ancient algorithms...",
    "Channeling digital spirits...",
    "Summoning binary wizards...",
    "Consulting the digital oracle...",
    "Convincing electrons to cooperate...",
    "Negotiating with stubborn pixels...",
    "Asking politely for RAM allocation...",
    "Bribing the cache memory...",
    "Untangling spaghetti code...",
    "Calibrating quantum flux capacitor...",
    "Initializing coffee.exe...",
    "Downloading more RAM...",
    "Sacrificing rubber ducks...",
    "Generating random excuses...",
    "Pretending to work...",
];

const SIZE_CLASSES = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
};

const OVERLAY_CLASSES = {
    fullscreen: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50",
    container: "absolute inset-0 bg-black/50 backdrop-blur-sm z-10",
    none: "",
};


const getRandomMessage = () =>
    MYSTICAL_MESSAGES[Math.floor(Math.random() * MYSTICAL_MESSAGES.length)];

const Loading: React.FC<LoadingProps> = ({
    message,
    overlay = "fullscreen",
    size = "md",
    color = "#23f2a1",
    show = true,
}) => {
    const [currentMessage, setCurrentMessage] = React.useState(
        message || getRandomMessage()
    );

    React.useEffect(() => {
        if (message) return;

        const interval = setInterval(() => {
            setCurrentMessage(getRandomMessage());
        }, 3000);

        return () => clearInterval(interval);
    }, [message]);

    const containerClasses = cn(
        OVERLAY_CLASSES[overlay],
        "flex items-center justify-center"
    );

    return (
        <div className={containerClasses}>
            <div className="flex flex-col items-center gap-4">
                <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    className={SIZE_CLASSES[size]}
                >
                    <motion.path
                        d="m9.711 6.428l2.195-1.26a.2.2 0 0 1 .201 0l5.786 3.322a.21.21 0 0 1 .107.17v2.285a.19.19 0 0 1-.103.171l-2.186 1.26c-.137.081-.282-.017-.282-.171v-2.049c0-.073-.073-.137-.133-.171L9.71 6.78a.201.201 0 0 1 0-.352M8.293 16.77l-2.19-1.26A.2.2 0 0 1 6 15.338V8.696c0-.069.039-.138.103-.172l1.984-1.148a.2.2 0 0 1 .202 0l2.19 1.255a.202.202 0 0 1 0 .352L8.7 10.01c-.064.039-.129.103-.129.172v6.415c0 .155-.141.249-.278.172M18 15.334a.2.2 0 0 1-.103.176l-5.756 3.321a.2.2 0 0 1-.197 0L9.96 17.696a.2.2 0 0 1-.103-.172V15c0-.154.172-.253.3-.172l1.783 1.016a.21.21 0 0 0 .201 0l5.555-3.206a.2.2 0 0 1 .3.172H18z"
                        fill="none"
                        stroke={color}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        strokeWidth="1"
                        pathLength={1}
                        strokeDasharray="1"
                        strokeDashoffset={1}
                        animate={{ strokeDashoffset: [1, 0] }}
                        transition={{
                            duration: 2.5,
                            ease: "linear",
                            repeat: Infinity,
                            repeatDelay: 0.8,
                        }}
                    />
                </svg>

                {show &&
                    < motion.p
                        key={currentMessage}
                        className="text-sm  text-center max-w-xs text-muted-foreground"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                    >
                        {currentMessage}
                    </motion.p>
                }
            </div>
        </div >
    );
};

export default Loading;
