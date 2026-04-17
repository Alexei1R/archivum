import { User, Settings, LogOut, UserPlus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
    DropdownMenu,
} from "@/shared/components/ui";
import { Avatar } from "@/shared/components/ui/avatar";
import { useAuthActions, useAuthStore } from "@/features/auth";
import { getInitials } from "@/shared/utils";


const Profile = () => {

    const { logout } = useAuthActions();
    //NOTE: Fallback user in case the is null
    const user = useAuthStore(state => state.user) || {
        avatar: 'https://github.com/shadcn.png',
        name: 'Guest User',
        email: 'guest@gmail.com'
    }




    return (
        <DropdownMenu>
            <DropdownMenu.Trigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-6 w-6">
                        <Avatar.Image src={user.avatar} />
                        <Avatar.Fallback className="text-xs">
                            {getInitials(user.name)}
                        </Avatar.Fallback>
                    </Avatar>
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="center" className="max-w-48">
                <DropdownMenu.Label className="font-normal">
                    <div className="flex items-center gap-3 p-2">
                        <Avatar className="h-6 w-6">
                            <Avatar.Image src={user.avatar} />
                            <Avatar.Fallback className="text-sm">
                                {getInitials(user.name)}
                            </Avatar.Fallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1 min-w-0">
                            <p className="text-xs font-medium leading-none truncate">
                                {user.name}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground truncate">
                                {user.email}
                            </p>
                        </div>
                    </div>
                </DropdownMenu.Label>
                <DropdownMenu.Group>
                    <DropdownMenu.Item>
                        <User className="mr-2 h-4 w-4" />
                        <span>Projects</span>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>Share</span>
                    </DropdownMenu.Item>
                </DropdownMenu.Group>
                <DropdownMenu.Item
                    onClick={() => logout()}
                    variant="destructive"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu>
    );
}


export { Profile };
