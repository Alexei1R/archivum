import { Auth } from "./components";
import { useAuthActions } from "./hooks/api";


const providers = [
    "google",
]

const Main = () => {

    return (
        < Auth providers={providers} onSignIn={useAuthActions().startOAuth} />
    )

}


export default Main;
