import { Check } from "lucide-react-native";
import { Image, Linking, ScrollView, View } from "react-native";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { homeScreenForRole } from "@/src/auth/roles";
import { useAuth } from "@/src/auth/AuthContext";
import {
  AppBtn,
  BottomNav,
  ScreenShell,
} from "@/src/cdrms/components/primitives";
import type { Go, NavTab } from "@/src/cdrms/types";
import { getErrorKindConfig } from "./error-kind-config";
import {
  ERROR_BUTTON_LABELS,
  ERROR_COPY,
  ERROR_TIPS_HEADING,
} from "./error-copy";
import type { ErrorActionId, ErrorKind } from "./types";

export type ErrorScreenProps = {
  go: Go;
  kind?: ErrorKind;
  status?: number | null;
  /** Keep BottomNav visible (authenticated home shell). */
  variant?: "global" | "shell";
  onRetry?: () => void;
  activeTab?: NavTab;
};

function resolveHomeAction(
  action: ErrorActionId,
  isAuthenticated: boolean,
): ErrorActionId {
  if (action === "goHome" || action === "goDashboard") {
    return isAuthenticated ? "goDashboard" : "goHome";
  }
  return action;
}

export function ErrorScreen({
  go,
  kind = "network",
  status = null,
  variant = "global",
  onRetry,
  activeTab = "home",
}: ErrorScreenProps) {
  const { isAuthenticated, user } = useAuth();
  const cfg = getErrorKindConfig(kind, status);
  const accent = cfg.accent;
  const copyKey =
    kind === "unauthorized" && status === 403 ? "forbidden" : kind;
  const copy = ERROR_COPY[copyKey];
  const tips = copy.tips.slice(0, cfg.tipCount);

  const primary = resolveHomeAction(cfg.primaryAction, isAuthenticated);
  const secondary = resolveHomeAction(cfg.secondaryAction, isAuthenticated);

  const goHome = () => {
    if (isAuthenticated) go(homeScreenForRole(user), { replace: true });
    else go("login", { replace: true });
  };

  const handleGoBack = () => {
    go(isAuthenticated ? homeScreenForRole(user) : "login", { replace: true });
  };

  const handleAction = (action: ErrorActionId) => {
    switch (action) {
      case "goBack":
        handleGoBack();
        break;
      case "goHome":
        go("login", { replace: true });
        break;
      case "goDashboard":
        goHome();
        break;
      case "retry":
      case "retryLater":
      case "goStatus":
        if (onRetry) onRetry();
        else goHome();
        break;
      case "loginNow":
        go("login", { replace: true });
        break;
      case "contactSupport":
      case "contactAdmin": {
        const subject = encodeURIComponent("CDRMS Support Request");
        void Linking.openURL(`mailto:?subject=${subject}`);
        break;
      }
      default:
        break;
    }
  };

  const showShell = variant === "shell" && isAuthenticated;

  return (
    <ScreenShell>
      <VStack className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingVertical: 16,
            paddingBottom: showShell ? 24 : 16,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              marginHorizontal: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              backgroundColor: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                padding: 20,
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 16,
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1, minWidth: 180 }}>
                <Text style={{ color: accent, fontSize: 13, fontWeight: "600" }}>
                  {copy.eyebrow}
                </Text>
                {cfg.code != null ? (
                  <Text
                    style={{
                      color: accent,
                      fontSize: 56,
                      fontWeight: "800",
                      lineHeight: 60,
                      marginTop: 4,
                    }}
                  >
                    {String(cfg.code)}
                  </Text>
                ) : null}
                <Text className="mt-2 text-2xl font-extrabold text-foreground">
                  {copy.title}
                </Text>
                <Text className="mt-2 text-sm text-muted-foreground">
                  {copy.description}
                </Text>
              </View>
              <Image
                source={cfg.illustration}
                style={{ width: 140, height: 140, resizeMode: "contain" }}
                accessibilityIgnoresInvertColors
              />
            </View>

            <View style={{ backgroundColor: cfg.tipsBg, padding: 20 }}>
              <Text className="text-base font-bold text-foreground">
                {ERROR_TIPS_HEADING}
              </Text>
              <VStack space="sm" className="mt-3">
                {tips.map((tip) => (
                  <View
                    key={tip}
                    style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}
                  >
                    <View
                      style={{
                        marginTop: 2,
                        height: 20,
                        width: 20,
                        borderRadius: 10,
                        backgroundColor: accent,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={12} color="#fff" strokeWidth={3} />
                    </View>
                    <Text className="flex-1 text-sm text-foreground">{tip}</Text>
                  </View>
                ))}
              </VStack>

              <VStack space="md" className="mt-6">
                <AppBtn onPress={() => handleAction(primary)}>
                  {ERROR_BUTTON_LABELS[primary]}
                </AppBtn>
                <AppBtn
                  variant="outline"
                  onPress={() => handleAction(secondary)}
                >
                  {ERROR_BUTTON_LABELS[secondary]}
                </AppBtn>
              </VStack>
            </View>
          </View>
        </ScrollView>

        {showShell ? (
          <BottomNav active={activeTab} onNav={go} />
        ) : (
          <Box className="h-2" />
        )}
      </VStack>
    </ScreenShell>
  );
}
