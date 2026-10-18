import { FraudLogsView } from "../../../Components/Growth";
import { listFraudLogs, reviewFraudLog } from "../../../utils/adminReferralApi";

const api = { listFraudLogs, reviewFraudLog };

export default function ReferralFraudLogs() {
  return (
    <FraudLogsView
      program="referral"
      api={api}
      title="Referral fraud logs"
      description="Suspicious referral activity to investigate and resolve."
    />
  );
}
