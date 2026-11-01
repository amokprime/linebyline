---
summary: Vibecoding workflow patterns for the LineByLine chat.z.ai web-channel sandbox. One workflow per session. The agent handles blue square nodes (code, review, test — looped until both pass); the user handles green/red/yellow nodes (onboard, decisions, push, wrap up).
links:
  - "[[scripts/README|README]]"
  - "[[ai/Diagrammo flowcharts|Diagrammo flowcharts]]"
---
## Division of labor

**Agent** handles the blue square nodes (`[Build]`, `[Review]`, `[Test]`, `[Skills]`, `[Investigate]`, `[Plan]`, `[Attempt]`). After building or patching, the agent loops Review ↔ Test until both code-quality checks and tests pass — the user does not need to announce "Review step" or "Test step" separately.

**User** handles the green pills (`(Onboard)`, `(Propose)`, `(Wrap up)`), the yellow diamond decisions (`<More features?>`, `<SonarCloud?>`, `<Worked?>`, `<Doable now?>`), and the push. The user reports SonarCloud failures back to the agent for another Review pass.

The workflows below are variations on this split. The diagrams show which nodes are agent-driven (blue) vs user-driven (green/yellow/red).

### Building one or more features
```dgmo
flowchart
direction-lr
(Onboard) -> [Build] -> [Review] -> [Test]
[Test] -> [Review]
-Reflect -> <More features?>
  -Yes -> [Build]
  -No — Push -> <SonarCloud?>
    -Issues -> [Review]
    -Clean -> (Wrap up)
```
The canonical workflow. The agent builds, then loops Review ↔ Test until both pass. The user decides whether to request more features, then pushes and reports SonarCloud results.

### Improving AI scaffolding
- Examples: [transcripts](https://github.com/amokprime/linebyline/tree/main/archive/skills)
```dgmo
flowchart
direction-lr
(Onboard) -> [Skills] -Push -> <SonarCloud?>
  -Issues -> [[#Remediating latent Sonar issues]]
  -Clean -> (Wrap up)
```
Meta-sessions on agent scaffolding (skills, scripts, context files). The agent verifies any skill scripts or packages that changed; no Test loop needed unless the changes touch app code.

### Remediating latent Sonar issues
Sometimes new SonarCloud issues appear with the same code that passed — e.g. commits after a ~1 month absence caused package versions to become outdated and app code smells to emerge (possibly due to updated Sonar definitions). Review patches can touch app code or workflows — anything exposed to SonarCloud scans.
```dgmo
flowchart
direction-lr
(Onboard) -> [Review] -> [Test]
[Test] -> [Review]
-Push -> <SonarCloud?>
  -Issues -> [Review]
  -Clean -> (Wrap up)
```
Same Review ↔ Test loop as the Building workflow, but the agent starts from Sonar issues rather than a feature request.

### Improving Playwright tests
- Examples: [transcripts](https://github.com/amokprime/linebyline/tree/main/archive/tests)
- Tests are grounded in app code; test-writing turns mainly touch test code, but can also modify app code if it is at fault.
```dgmo
flowchart
direction-lr
(Onboard) -> [Test] -> [Review]
[Review] -> [Test]
  -Push -> <SonarCloud?>
    -Issues -> [Review] -> [Test]
    -Clean -> (Wrap up)
```
Same loop, but Test leads and Review follows — the agent writes tests first, then reviews the test code + any app-code patches for quality.

### Researching and implementing high-level plans
Example of a high-level plan: [[ROADMAP]]. The exact content of steps varies; what is likely regardless:
- Proposals start out with half-baked criteria and become more refined in follow-up turns or even sessions
- Investigations need web searches to rule out alternatives or explore overlooked options, and manual follow-ups for taste or to access material behind login portals
- One idea often leads to another within the same session — this produces large buckets of proposed items for the agent to triage later
```dgmo
flowchart
direction-lr
(Onboard) -> (Propose) -> [Investigate] -> [Plan] -> <AI: Doable now?>
  -No -> [Split into stages to propose separately] -> (Wrap Up)
  -Yes -> [Attempt] -> <Worked?>
    -No -> [Investigate]
    -Yes -> <More ideas?>
      -No -> (Wrap Up)
      -Yes -> (Propose)
```
The agent investigates feasibility and drafts a plan. When most of the proposal involves code change, the agent is best qualified to judge whether it can handle it in one session/turn, or needs to write up a roadmap with tranches. If the attempt didn't work as expected, the user hands it back for further investigation.
