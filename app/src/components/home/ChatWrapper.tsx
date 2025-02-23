import { useTranslation } from "react-i18next";
import React, { useEffect, useRef, useState } from "react";
import FileProvider from "@/components/FileProvider.tsx";
import { useDispatch, useSelector } from "react-redux";
import { selectAuthenticated, selectInit } from "@/store/auth.ts";
import {
  selectMessages,
  selectModel,
  selectWeb,
  setWeb,
} from "@/store/chat.ts";
import { manager } from "@/conversation/manager.ts";
import { formatMessage } from "@/utils/processor.ts";
import ChatInterface from "@/components/home/ChatInterface.tsx";
import { Button } from "@/components/ui/button.tsx";
import router from "@/router.tsx";
import {
  BookMarked,
  ChevronRight,
  FolderKanban,
  Globe,
  Newspaper,
  Users2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { Toggle } from "@/components/ui/toggle.tsx";
import { Input } from "@/components/ui/input.tsx";
import EditorProvider from "@/components/EditorProvider.tsx";
import ModelSelector from "./ModelSelector.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { version } from "@/conf.ts";
import { clearHistoryState, getQueryParam } from "@/utils/path.ts";
import { forgetMemory, popMemory, setMemory } from "@/utils/memory.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { ToastAction } from "@/components/ui/toast.tsx";
import {
  alignSelector,
  contextSelector,
  openDialog,
} from "@/store/settings.ts";
import { isSubscribedSelector } from "@/store/subscription.ts";
import { FileArray } from "@/conversation/file.ts";

function ChatSpace() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const subscription = useSelector(isSubscribedSelector);
  return (
    <div className={`chat-product`}>
      <Button variant={`outline`} onClick={() => setOpen(true)}>
        <Users2 className={`h-4 w-4 mr-1.5`} />
        {t("contact.title")}
        <ChevronRight className={`h-4 w-4 ml-2`} />
      </Button>
      {subscription && (
        <Button variant={`outline`} onClick={() => router.navigate("/article")}>
          <Newspaper className={`h-4 w-4 mr-1.5`} />
          {t("article.title")}
          <ChevronRight className={`h-4 w-4 ml-2`} />
        </Button>
      )}
      <Button variant={`outline`} onClick={() => router.navigate("/generate")}>
        <FolderKanban className={`h-4 w-4 mr-1.5`} />
        {t("generate.title")}
        <ChevronRight className={`h-4 w-4 ml-2`} />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("contact.title")}</DialogTitle>
            <DialogDescription asChild>
              <div className={`grid pt-4`}>
                <Button
                  className={`mx-auto`}
                  variant={`outline`}
                  onClick={() =>
                    window.open("https://docs.chatnio.net", "_blank")
                  }
                >
                  <BookMarked className={`h-4 w-4 mr-1.5`} />
                  {t("docs.title")}
                </Button>
                <a
                  href={
                    "http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=1oKfIbNVXmMNMVzW1NiFSTKDcT1qIEq5&authKey=uslxslIBZtLImf4BSxjDqfx4hiJA52YV7PFM38W%2BOArr%2BhE0jwVdQCRYs0%2FXKX7W&noverify=0&group_code=565902327"
                  }
                  target={"_blank"}
                  className={`inline-flex mx-auto mt-1 mb-2`}
                >
                  <img
                    src={`/source/qq.jpg`}
                    className={`contact-image`}
                    alt={`QQ`}
                  />
                </a>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChatWrapper() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileArray>([]);
  const [input, setInput] = useState("");
  const dispatch = useDispatch();
  const init = useSelector(selectInit);
  const auth = useSelector(selectAuthenticated);
  const model = useSelector(selectModel);
  const web = useSelector(selectWeb);
  const messages = useSelector(selectMessages);
  const target = useRef(null);
  const context = useSelector(contextSelector);
  const align = useSelector(alignSelector);

  manager.setDispatch(dispatch);

  function clearFile() {
    setFiles([]);
  }

  async function processSend(
    data: string,
    auth: boolean,
    model: string,
    web: boolean,
    context: boolean,
  ): Promise<boolean> {
    const message: string = formatMessage(files, data);
    if (message.length > 0 && data.trim().length > 0) {
      if (
        await manager.send(t, auth, {
          type: "chat",
          message,
          web,
          model,
          ignore_context: !context,
        })
      ) {
        forgetMemory("history");
        clearFile();
        return true;
      }
    }
    return false;
  }

  async function handleSend(auth: boolean, model: string, web: boolean) {
    // because of the function wrapper, we need to update the selector state using props.
    if (await processSend(input, auth, model, web, context)) {
      setInput("");
    }
  }

  window.addEventListener("load", () => {
    const el = document.getElementById("input");
    if (el) el.focus();
  });

  useEffect(() => {
    if (!init) return;
    const query = getQueryParam("q").trim();
    if (query.length > 0) processSend(query, auth, model, web, context).then();
    clearHistoryState();
  }, [init]);

  useEffect(() => {
    const history: string = popMemory("history");
    if (history.length) {
      setInput(history);
      toast({
        title: t("chat.recall"),
        description: t("chat.recall-desc"),
        action: (
          <ToastAction
            altText={t("chat.recall-cancel")}
            onClick={() => {
              setInput("");
            }}
          >
            {t("chat.recall-cancel")}
          </ToastAction>
        ),
      });
    }
  }, []);

  return (
    <div className={`chat-container`}>
      <div className={`chat-wrapper`}>
        {messages.length > 0 ? <ChatInterface /> : <ChatSpace />}
        <div className={`chat-input`}>
          <div className={`input-wrapper`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    aria-label={t("chat.web-aria")}
                    defaultPressed={false}
                    onPressedChange={(state: boolean) =>
                      dispatch(setWeb(state))
                    }
                    variant={`outline`}
                  >
                    <Globe className={`h-4 w-4 web ${web ? "enable" : ""}`} />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  <p className={`tooltip`}>{t("chat.web")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className={`chat-box`}>
              <FileProvider
                value={files}
                onChange={setFiles}
                id={`file`}
                className={`file`}
              />
              <Input
                id={`input`}
                className={`input-box ${align && "align"}`}
                ref={target}
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setInput(e.target.value);
                  setMemory("history", e.target.value);
                }}
                placeholder={t("chat.placeholder")}
                onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") await handleSend(auth, model, web);
                }}
              />
              <EditorProvider
                value={input}
                onChange={setInput}
                className={`editor`}
                id={`editor`}
                placeholder={t("chat.placeholder")}
                maxLength={8000}
              />
            </div>
            <Button
              size={`icon`}
              variant="outline"
              className={`send-button`}
              onClick={() => handleSend(auth, model, web)}
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <path d="m21.426 11.095-17-8A1 1 0 0 0 3.03 4.242l1.212 4.849L12 12l-7.758 2.909-1.212 4.849a.998.998 0 0 0 1.396 1.147l17-8a1 1 0 0 0 0-1.81z"></path>
              </svg>
            </Button>
          </div>
          <div className={`input-options`}>
            <ModelSelector side={`bottom`} />
          </div>
          <div className={`version`}>
            <svg
              className={`app`}
              onClick={() => {
                // triggerInstallApp();
                dispatch(openDialog());
              }}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path
                d="M9 3h-4a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2z"
                strokeWidth="0"
                fill="currentColor"
              />
              <path
                d="M9 13h-4a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2z"
                strokeWidth="0"
                fill="currentColor"
              />
              <path
                d="M19 13h-4a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2z"
                strokeWidth="0"
                fill="currentColor"
              />
              <path
                d="M17 3a1 1 0 0 1 .993 .883l.007 .117v2h2a1 1 0 0 1 .117 1.993l-.117 .007h-2v2a1 1 0 0 1 -1.993 .117l-.007 -.117v-2h-2a1 1 0 0 1 -.117 -1.993l.117 -.007h2v-2a1 1 0 0 1 1 -1z"
                strokeWidth="0"
                fill="currentColor"
              />
            </svg>
            chatnio v{version}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatWrapper;
