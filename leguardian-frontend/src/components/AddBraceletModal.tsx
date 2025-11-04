import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useBraceletStore } from "../stores/braceletStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  QrCode,
  Smartphone,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  Camera,
} from "lucide-react";
import { QRScanner } from "./QRScanner";

interface AddBraceletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BraceletRegistrationContent = ({
  showManualInput,
  setShowManualInput,
  qrInput,
  setQrInput,
  uniqueCode,
  setUniqueCode,
  isProcessing,
  isLoading,
  error,
  handleQRScan,
  handleManualRegister,
  t,
  isMobile,
  useCamera,
  setUseCamera,
}: {
  showManualInput: boolean;
  setShowManualInput: (value: boolean) => void;
  qrInput: string;
  setQrInput: (value: string) => void;
  uniqueCode: string;
  setUniqueCode: (value: string) => void;
  isProcessing: boolean;
  isLoading: boolean;
  error: string | null;
  handleQRScan: (e: React.FormEvent) => Promise<void>;
  handleManualRegister: (e: React.FormEvent) => Promise<void>;
  t: any;
  isMobile: boolean;
  useCamera: boolean;
  setUseCamera: (value: boolean) => void;
}) => (
  <div className="space-y-6">
    {error && (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("errors.serverError")}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}

    {/* Mode Selection - Hide when using camera */}
    {!(isMobile && useCamera) && (
      <div className="grid grid-cols-2 gap-4">
        {/* QR Mode Card */}
        <button
          type="button"
          onClick={() => setShowManualInput(false)}
          className={`p-4 rounded-lg border-2 transition-all ${
            !showManualInput
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <div
              className={`p-2 rounded-lg ${
                !showManualInput ? "bg-primary" : "bg-secondary"
              }`}
            >
              <QrCode
                className={`w-5 h-5 ${
                  !showManualInput
                    ? "text-primary-foreground"
                    : "text-foreground"
                }`}
              />
            </div>
            <h3 className="font-medium text-foreground">
              {t("braceletRegister.qrCode")}
            </h3>
            <p className="text-xs text-muted-foreground text-center">
              {t("braceletRegister.qrDescription")}
            </p>
          </div>
        </button>

        {/* Manual Mode Card */}
        <button
          type="button"
          onClick={() => setShowManualInput(true)}
          className={`p-4 rounded-lg border-2 transition-all ${
            showManualInput
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <div
              className={`p-2 rounded-lg ${
                showManualInput ? "bg-primary" : "bg-secondary"
              }`}
            >
              <Smartphone
                className={`w-5 h-5 ${
                  showManualInput
                    ? "text-primary-foreground"
                    : "text-foreground"
                }`}
              />
            </div>
            <h3 className="font-medium text-foreground">
              {t("braceletRegister.manual")}
            </h3>
            <p className="text-xs text-muted-foreground text-center">
              {t("braceletRegister.manualDescription")}
            </p>
          </div>
        </button>
      </div>
    )}

    {/* Camera Mode - Full screen when activated */}
    {isMobile && useCamera ? (
      <div className="space-y-4">
        <QRScanner
          onScan={(code) => {
            setQrInput(code);
            setUseCamera(false);
          }}
          onClose={() => setUseCamera(false)}
          isScanning={true}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setUseCamera(false)}
          className="w-full"
        >
          {t("braceletRegister.back")}
        </Button>
      </div>
    ) : (
      <>
        {/* Form - QR or Manual based on mode */}
        {!showManualInput ? (
          /* QR Code Mode */
          <form onSubmit={handleQRScan} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("braceletRegister.scanQR")}
              </label>
              <Input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder={t("braceletRegister.codeWillAppear")}
                autoFocus
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground">
                {t("braceletRegister.qrCodeLocation")}
              </p>
            </div>

            {/* Camera button for mobile */}
            {isMobile && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setUseCamera(true)}
                className="w-full gap-2"
              >
                <Camera className="w-4 h-4" />
                {t("braceletRegister.useCamera")}
              </Button>
            )}

            <Button
              type="submit"
              disabled={isLoading || isProcessing || !qrInput.trim()}
              className="w-full gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t("braceletRegister.next")}...
                </>
              ) : (
                <>
                  {t("braceletRegister.next")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        ) : (
          /* Manual Input Mode */
          <form onSubmit={handleManualRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("braceletRegister.code")}
              </label>
              <Input
                type="text"
                value={uniqueCode}
                onChange={(e) => setUniqueCode(e.target.value.toUpperCase())}
                placeholder="ex: BR001ABC"
                maxLength={20}
                className="font-mono"
                disabled={isProcessing}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {t("braceletRegister.codeFormat")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("braceletRegister.codeHint")}
              </p>
            </div>
            <Button
              type="submit"
              disabled={isLoading || isProcessing || !uniqueCode.trim()}
              className="w-full gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t("braceletRegister.next")}...
                </>
              ) : (
                <>
                  {t("braceletRegister.next")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}
      </>
    )}
  </div>
);

export const AddBraceletModal = ({
  open,
  onOpenChange,
}: AddBraceletModalProps) => {
  const { t } = useTranslation();
  const { registerBracelet, isLoading, error } = useBraceletStore();
  const [showManualInput, setShowManualInput] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [uniqueCode, setUniqueCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleQRScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = qrInput.trim();
    if (!code) return;

    setIsProcessing(true);
    try {
      await registerBracelet(code);
      toast.success("Bracelet registered successfully!", {
        description: `Code: ${code}`,
      });
      setQrInput("");
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to register bracelet";
      toast.error("Registration failed", {
        description: message,
      });
      console.error("Failed to register bracelet:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = uniqueCode.trim();
    if (!code) return;

    setIsProcessing(true);
    try {
      await registerBracelet(code);
      toast.success("Bracelet registered successfully!", {
        description: `Code: ${code}`,
      });
      setUniqueCode("");
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to register bracelet";
      toast.error("Registration failed", {
        description: message,
      });
      console.error("Failed to register bracelet:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isProcessing) {
      setShowManualInput(false);
      setQrInput("");
      setUniqueCode("");
      setUseCamera(false);
      onOpenChange(newOpen);
    }
  };

  return (
    <>
      {/* Desktop Modal */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-xl hidden md:flex md:flex-col max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("braceletRegister.title")}</DialogTitle>
            <DialogDescription>
              {t("braceletRegister.selectMode")}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto">
            <BraceletRegistrationContent
              showManualInput={showManualInput}
              setShowManualInput={setShowManualInput}
              qrInput={qrInput}
              setQrInput={setQrInput}
              uniqueCode={uniqueCode}
              setUniqueCode={setUniqueCode}
              isProcessing={isProcessing}
              isLoading={isLoading}
              error={error}
              handleQRScan={handleQRScan}
              handleManualRegister={handleManualRegister}
              t={t}
              isMobile={isMobile}
              useCamera={useCamera}
              setUseCamera={setUseCamera}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Drawer TEST */}
      {isMobile && (
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerContent className="max-h-none!">
            <DrawerHeader>
              <DrawerTitle>{t("braceletRegister.title")}</DrawerTitle>
              <DrawerDescription>
                {t("braceletRegister.selectMode")}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-8">
              <BraceletRegistrationContent
                showManualInput={showManualInput}
                setShowManualInput={setShowManualInput}
                qrInput={qrInput}
                setQrInput={setQrInput}
                uniqueCode={uniqueCode}
                setUniqueCode={setUniqueCode}
                isProcessing={isProcessing}
                isLoading={isLoading}
                error={error}
                handleQRScan={handleQRScan}
                handleManualRegister={handleManualRegister}
                t={t}
                isMobile={isMobile}
                useCamera={useCamera}
                setUseCamera={setUseCamera}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
};
