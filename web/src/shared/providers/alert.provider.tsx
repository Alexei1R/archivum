import * as React from "react";
import SystemAlert from "../components/alert/alert";


interface AlertProviderProps {
    children: React.ReactNode;
}

const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
    return (
        <>
            {children}
            <SystemAlert />
        </>
    );
};

export { AlertProvider };
