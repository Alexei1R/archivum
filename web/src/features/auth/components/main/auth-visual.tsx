import { AUTH_ASSETS, AUTH_CLASSES } from "@/features/auth/constants";
import { cn } from "@/shared/utils";

const AuthVisual = () => (
    <div className="relative hidden h-full overflow-hidden rounded-xl shadow-lg lg:block">
        <div className={cn("absolute inset-0", AUTH_CLASSES.desktopGradient)} />
        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute inset-0 flex items-end justify-center text-white">
            <div className="relative h-[min(132%,82rem)] w-[min(96%,62rem)]">
                <div className={cn(
                    AUTH_CLASSES.visualFont,
                    "absolute left-1/2 top-[16%] z-20 -translate-x-[60%] text-[clamp(6rem,11vw,11.75rem)]"
                )}>
                    ARCHI
                </div>
                <img
                    src={AUTH_ASSETS.sculpture}
                    alt="Classical sculpture"
                    className="absolute bottom-0 left-1/2 z-30 h-full -translate-x-1/2 object-contain grayscale"
                />
                <div className={cn(
                    AUTH_CLASSES.visualFont,
                    "absolute left-1/2 top-[36%] z-40 -translate-x-[2%] text-[clamp(6rem,11vw,11.75rem)]"
                )}>
                    VUM
                </div>
            </div>
        </div>
    </div>
);

const MobileAuthVisual = () => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
        <div className={cn("absolute inset-0", AUTH_CLASSES.mobileGradient)} />
        <div className="absolute inset-0 bg-background/35 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-black/35" />

        <div className="absolute inset-x-0 bottom-0 mx-auto h-[78vh] max-w-lg text-white opacity-55 blur-[1px]">
            <img
                src={AUTH_ASSETS.sculpture}
                alt="Classical sculpture"
                className="absolute bottom-[-24%] left-1/2 z-10 h-[145%] -translate-x-1/2 object-contain opacity-55 grayscale"
            />
        </div>
    </div>
);

export { AuthVisual, MobileAuthVisual };
