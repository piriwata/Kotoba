import React from "react";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpdateInfo {
  latestVersion: string;
  releaseUrl: string;
  releaseNotes: string | null;
}

interface UpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: UpdateInfo | null;
}

export function UpdateDialog({ isOpen, onClose, updateInfo }: UpdateDialogProps) {
  const { t } = useTranslation();

  const handleDownload = async () => {
    if (updateInfo?.releaseUrl && window.electronAPI?.openExternal) {
      await window.electronAPI.openExternal(updateInfo.releaseUrl);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("updateDialog.title")}</DialogTitle>
          <DialogDescription>
            {updateInfo
              ? t("updateDialog.description", { version: updateInfo.latestVersion })
              : ""}
          </DialogDescription>
        </DialogHeader>
        {updateInfo?.releaseNotes && (
          <div className="max-h-40 overflow-y-auto rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
            {updateInfo.releaseNotes}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("updateDialog.dismiss")}
          </Button>
          <Button onClick={handleDownload} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            {t("updateDialog.download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
