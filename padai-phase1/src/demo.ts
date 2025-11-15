export const DEMO_JSONL = `
{"id":"A","title":"Provision DB","status":"open","priority":2,"issue_type":"task"}
{"id":"B","title":"Create API for users","status":"in_progress","priority":2,"issue_type":"feature","dependencies":[{"issue_id":"B","depends_on_id":"A","type":"blocks"}]}
{"id":"C","title":"UI Login","status":"open","priority":1,"issue_type":"feature","dependencies":[{"issue_id":"C","depends_on_id":"B","type":"blocks"}]}
{"id":"D","title":"Add telemetry","status":"open","priority":1,"issue_type":"feature","dependencies":[{"issue_id":"D","depends_on_id":"B","type":"related"}]}
{"id":"E","title":"Refactor CSS","status":"closed","priority":0,"issue_type":"chore"}
{"id":"F","title":"Design landing page","status":"open","priority":0,"issue_type":"task"}
{"id":"G","title":"Add SSO","status":"blocked","priority":3,"issue_type":"feature","dependencies":[{"issue_id":"G","depends_on_id":"B","type":"blocks"},{"issue_id":"G","depends_on_id":"D","type":"related"}]}
{"id":"H","title":"Write README","status":"open","priority":0,"issue_type":"task"}
`;
