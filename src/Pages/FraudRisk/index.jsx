import { FraudLogsView } from "../../Components/Growth";
import { listFraudLogs, reviewFraudLog } from "../../utils/adminReferralApi";

const api = { listFraudLogs, reviewFraudLog };

// Referral and affiliate fraud share one table (discriminated by `program`), so one page covers both.
export default function FraudRisk() {
  return (
    <FraudLogsView
      program="all"
      api={api}
      defaultStatus="PENDING_REVIEW"
      title="Fraud & risk"
      description="Suspicious activity across referral and affiliate programs. Showing cases awaiting review."
    />
  );
}
