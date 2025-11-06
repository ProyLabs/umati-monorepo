import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Fbutton } from "@/components/ui/fancy-button";
import Link from "next/link";

export default async function UserAvatar() {
  // const session = await auth.api.getSession({
  //   headers: await headers(),
  // });


    return (
        <Link href="/auth/login">
      <Fbutton size="sm"  variant="secondary">
        Login
      </Fbutton>
        </Link>
    );


  // return (
  //   <Avatar className="rounded-lg size-9 md:size-10 border-2 border-foreground">
  //     <AvatarImage
  //       src={"https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_20.png"}
  //       alt={"LoveAkinlesi"}
  //     />
  //     <AvatarFallback>LA</AvatarFallback>
  //   </Avatar>
  // );
}
