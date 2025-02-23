import NavBar from "./NavBar.tsx";
import { ThemeProvider } from "@/components/ThemeProvider.tsx";
import DialogManager from "@/dialogs";

function AppProvider() {
  return (
    <>
      <NavBar />
      <ThemeProvider />
      <DialogManager />
    </>
  );
}

export default AppProvider;
