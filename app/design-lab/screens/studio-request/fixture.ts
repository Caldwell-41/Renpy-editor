export const sampleMessage = "This is a synthetic Loomlight connection test. Reply with the short text: Loomlight synthetic response. No tools.";
export const sampleCompletion = "Loomlight synthetic response.";
export interface SampleProfile { id: string; label: string; model: string; endpoint: string; credential: boolean; disabled: boolean; context: number; response: number }
export function profiles(long = false): SampleProfile[] {
  return [
    { id: "writing", label: long ? "Writing studio · The Last Tram · local revision for the platform announcement scene" : "Writing studio", model: long ? "tram-writer-32b-instruct-q4-k-m-local-diagnostic-build" : "tram-writer-32b", endpoint: "http://127.0.0.1:8888/v1", credential: true, disabled: false, context: 32768, response: 16384 },
    { id: "archive", label: "Archive studio · Disabled", model: "archive-writer-8b", endpoint: "http://127.0.0.1:8889/v1", credential: true, disabled: true, context: 8192, response: 2048 },
    { id: "draft", label: "Draft studio · Credential needed", model: "tram-writer-8b", endpoint: "http://127.0.0.1:8890/v1", credential: false, disabled: false, context: 16384, response: 4096 },
  ];
}
export const stages = [
  { id: "checking_model", short: "Readiness", title: "Checking model readiness", detail: "The sample checks the selected model and its available context." },
  { id: "loading_model", short: "Model", title: "Loading the selected model", detail: "The sample model is loading. You can cancel this client request." },
  { id: "sending", short: "Send", title: "Sending the fixed message", detail: "Only the synthetic message is part of this sample request." },
  { id: "receiving", short: "Receive", title: "Receiving response", detail: "Waiting for the complete sample response before displaying its text." },
  { id: "validating", short: "Validate", title: "Checking response", detail: "The sample checks completion format before publishing the result." },
] as const;
