import { FraudLogsView } from "../../../Components/Growth";
import { listFraudLogs, reviewFraudLog } from "../../../utils/adminAffiliateApi";

const api = { listFraudLogs, reviewFraudLog };

export default function AffiliateFraudLogs() {
  return (
    <FraudLogsView
      program="affiliate"
      api={api}
      title="Affiliate fraud logs"
      description="Suspicious affiliate activity to investigate and resolve."
    />
  );
}
