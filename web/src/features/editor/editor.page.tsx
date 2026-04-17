// import Editor from "./editor";
import Viewport from "./viewport";

const EditorPage: React.FC = () => {

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden">
            {/* <Editor /> */}
            <Viewport />
        </div>
    );
};

export const Component = EditorPage;
