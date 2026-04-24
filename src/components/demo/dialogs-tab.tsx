"use client";

import { useTranslations } from "next-intl";
import { AppDialog } from "@/components/app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import Iconify from "@/components/ui/iconify";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useCountdown } from "@/hooks/use-countdown";
import { toastError, toastInfo, toastSuccess, toastWarning } from "@/lib/toast";
import { useLoaderStore } from "@/store/loader.store";

export function DemoDialogsTab() {
  const t = useTranslations();
  const tDemo = useTranslations("demo");
  const tView = useTranslations("demo.typography");
  const { copy, copied } = useCopyToClipboard();
  const { seconds, isRunning, start } = useCountdown(30);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{tDemo("dialogs.toastsAndDialogs")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <AppDialog
            trigger={<Button variant="outline">{tDemo("dialogs.openDialog")}</Button>}
            title={tDemo("dialogs.areYouSure")}
            description={tDemo("dialogs.actionCannotBeUndone")}
            footer={
              <Button
                onClick={() =>
                  toastSuccess(tDemo("dialogs.confirmed"), tDemo("dialogs.actionExecuted"))
                }
              >
                {t("confirm")}
              </Button>
            }
            showCloseButton
          >
            <Typography variant="caption2" className="text-muted-foreground text-sm">
              {tDemo("dialogs.deleteItemPermanently")}
            </Typography>
          </AppDialog>

          <AppDialog
            trigger={<Button variant="outline">{tDemo("dialogs.nestedDialog")}</Button>}
            title={tDemo("dialogs.welcome")}
            description={tDemo("dialogs.reusableDialog")}
            size="sm"
          >
            <Typography variant="caption2" className="text-foreground text-sm">
              {tDemo("dialogs.nestedBody")}
            </Typography>
          </AppDialog>

          <Button
            variant="outline"
            onClick={() =>
              toastSuccess(tDemo("dialogs.success"), tDemo("dialogs.operationCompleted"))
            }
          >
            <Iconify icon="lucide:check-circle" />
            {tDemo("dialogs.success")}
          </Button>
          <Button
            variant="outline"
            onClick={() => toastError(tDemo("dialogs.error"), tDemo("dialogs.somethingWentWrong"))}
          >
            <Iconify icon="lucide:x-circle" />
            {tDemo("dialogs.error")}
          </Button>
          <Button
            variant="outline"
            onClick={() => toastInfo(tDemo("dialogs.info"), tDemo("dialogs.someInformation"))}
          >
            <Iconify icon="lucide:info" />
            {tDemo("dialogs.info")}
          </Button>
          <Button
            variant="outline"
            onClick={() => toastWarning(tDemo("dialogs.warning"), tDemo("dialogs.pleaseBeCareful"))}
          >
            <Iconify icon="lucide:alert-triangle" />
            {tDemo("dialogs.warning")}
          </Button>

          <Button variant="outline" loading>
            {tDemo("dialogs.loadingButton")}
          </Button>

          <Button variant="outline" onClick={() => copy("skeleton-app")}>
            <Iconify icon={copied ? "lucide:check" : "lucide:copy"} />
            {copied ? tDemo("dialogs.copied") : tDemo("dialogs.copyText")}
          </Button>

          <Button variant="outline" onClick={() => start()} disabled={isRunning}>
            <Iconify icon="lucide:timer" />
            {isRunning ? tDemo("dialogs.resendIn", { seconds }) : tDemo("dialogs.startCountdown")}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tView("showcase.tooltipTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <Iconify icon="lucide:info" className="size-4" />
                  <Typography variant="label2" as="span">
                    {tView("showcase.tooltipTrigger")}
                  </Typography>
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6} className="max-w-xs">
                <Typography variant="caption2" as="p" className="text-background">
                  {tView("showcase.tooltipContent")}
                </Typography>
              </TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tView("showcase.popoverTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="secondary" size="sm" className="gap-2">
                  <Iconify icon="lucide:panel-top-open" className="size-4" />
                  <Typography variant="label2" as="span">
                    {tView("showcase.popoverTrigger")}
                  </Typography>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="space-y-2" align="start">
                <PopoverHeader>
                  <PopoverTitle>
                    <Typography variant="subtitle2" as="span">
                      {tView("showcase.popoverHeading")}
                    </Typography>
                  </PopoverTitle>
                </PopoverHeader>
                <Typography variant="caption1" as="p" color="muted">
                  {tView("showcase.popoverBody")}
                </Typography>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tView("showcase.drawerTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Drawer>
              <DrawerTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <Iconify icon="lucide:panel-bottom" className="size-4" />
                  <Typography variant="label2" as="span">
                    {tView("showcase.drawerTrigger")}
                  </Typography>
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>{tView("showcase.drawerHeading")}</DrawerTitle>
                  <DrawerDescription>{tView("showcase.drawerBody")}</DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button type="button" variant="secondary" className="w-full sm:w-auto">
                      <Typography variant="label2" as="span">
                        {tView("showcase.drawerClose")}
                      </Typography>
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tView("showcase.sheetTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Sheet>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <Iconify icon="lucide:sidebar-open" className="size-4" />
                  <Typography variant="label2" as="span">
                    {tView("showcase.sheetTrigger")}
                  </Typography>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>{tView("showcase.sheetHeading")}</SheetTitle>
                  <SheetDescription>{tView("showcase.sheetBody")}</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{tDemo("dialogs.spinnerInline")}</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingIndicator variant="spinner" loadingKey="never-exists" />
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <LoadingIndicator variant="spinner" loadingKey="__demo_spinner__" />
              <Typography variant="caption2" as="span" className="text-muted-foreground text-sm">
                {tDemo("dialogs.demoSpinner")}
              </Typography>
            </div>
            <DemoSpinner />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{tDemo("dialogs.disabledRegion")}</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingIndicator variant="disabled" loadingKey="__demo_disabled__">
              <DemoDisabledRegion />
            </LoadingIndicator>
            <DemoDisabledTrigger />
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">{tDemo("dialogs.overlayAxios")}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {tDemo("dialogs.overlayDescription")}{" "}
            <code className="bg-muted rounded px-1 text-xs">layout.tsx</code>.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DemoSpinner() {
  const tDemo = useTranslations("demo");
  const add = useLoaderStore((state) => state.add);
  const remove = useLoaderStore((state) => state.remove);
  const isOn = useLoaderStore((state) => (state.keys["__demo_spinner__"] ?? 0) > 0);

  return (
    <Button
      size="xs"
      variant="outline"
      className="mt-2"
      onClick={() => (isOn ? remove("__demo_spinner__") : add("__demo_spinner__"))}
    >
      {isOn ? tDemo("dialogs.stopSpinner") : tDemo("dialogs.startSpinner")}
    </Button>
  );
}

function DemoDisabledRegion() {
  const tDemo = useTranslations("demo");

  return (
    <div className="space-y-2">
      <input
        className="border-input flex h-8 w-full rounded-md border bg-transparent px-3 py-1 text-start text-sm shadow-xs"
        placeholder={tDemo("dialogs.disabledPlaceholder")}
      />
      <Button size="sm" className="w-full">
        {tDemo("dialogs.action")}
      </Button>
    </div>
  );
}

function DemoDisabledTrigger() {
  const tDemo = useTranslations("demo");
  const add = useLoaderStore((state) => state.add);
  const remove = useLoaderStore((state) => state.remove);
  const isOn = useLoaderStore((state) => (state.keys["__demo_disabled__"] ?? 0) > 0);

  return (
    <Button
      size="xs"
      variant="outline"
      className="mt-2"
      onClick={() => (isOn ? remove("__demo_disabled__") : add("__demo_disabled__"))}
    >
      {isOn ? tDemo("dialogs.reEnable") : tDemo("dialogs.disableRegion")}
    </Button>
  );
}
