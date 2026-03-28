import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Activity, Zap, Wind } from "lucide-react";
import type { ShieldData } from "./types";

interface HUDProps {
  data: ShieldData;
  isActive: boolean;
}

const HUDCard = ({
  icon,
  label,
  value,
  isActive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isActive: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`p-4 rounded-xl border ${isActive ? "border-blue-500/30 bg-blue-950/20" : "border-red-500/30 bg-red-950/20"} backdrop-blur-md transition-colors duration-1000`}
  >
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-[10px] font-mono tracking-widest opacity-60 uppercase">{label}</span>
    </div>
    <div className={`font-mono text-sm ${isActive ? "text-blue-100" : "text-red-100"}`}>{value}</div>
    {isActive && (
      <motion.div
        className="h-1 bg-blue-500/50 mt-3 rounded-full overflow-hidden"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 2 }}
      >
        <motion.div
          className="h-full bg-blue-400"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    )}
  </motion.div>
);

export const ShieldHUD = ({ data, isActive }: HUDProps) => {
  const { t } = useTranslation();
  const emfVal = t(`sriYantraShield.hudTokens.emf.${data.emf}`, data.emf);
  const pathogenVal = t(`sriYantraShield.hudTokens.pathogen.${data.pathogenLoad}`, data.pathogenLoad);
  const fearVal = t(`sriYantraShield.hudTokens.fear.${data.fearIndex}`, data.fearIndex);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
      <HUDCard
        icon={<Zap className={isActive ? "text-blue-400" : "text-red-400"} size={20} />}
        label={t("sriYantraShield.hudLabels.emf")}
        value={emfVal}
        isActive={isActive}
      />
      <HUDCard
        icon={<Wind className={isActive ? "text-blue-400" : "text-red-400"} size={20} />}
        label={t("sriYantraShield.hudLabels.pathogen")}
        value={pathogenVal}
        isActive={isActive}
      />
      <HUDCard
        icon={<Activity className={isActive ? "text-blue-400" : "text-red-400"} size={20} />}
        label={t("sriYantraShield.hudLabels.fear")}
        value={fearVal}
        isActive={isActive}
      />
    </div>
  );
};
