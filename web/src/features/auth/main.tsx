import { Auth } from "./components";
import { useAuthActions } from "./hooks/api";


const providers = [
    "google",
    "github",
]

const Main = () => {

    return (
        < Auth providers={providers} onSignIn={useAuthActions().startOAuth} />
    )

}


export default Main;
