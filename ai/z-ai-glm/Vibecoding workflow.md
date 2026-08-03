---
summary: Vibecoding workflows for LineByLine that use two or more Repomix snippets. One workflow per session.
links:
  - "[[ai/z-ai-glm/Repomix snippets|Repomix snippets]]"
  - "[[ai/z-ai-glm/Diagrammo flowcharts|Diagrammo flowcharts]]"
---
### Building one or more features
- I submit more than one feature request to the agent per turn in a substantial bucket when:
	- The requests are minor or patches on a semantic scale
	- I want to reduce the chance of requests conflicting with each other
```dgmo
flowchart
direction-lr
(Onboard) -> [Build] -> [Review] -> [Test]
-Reflect -> <More features?>
  -Yes -> [Build]
  -No — Push -> <SonarCloud?>
    -Issues -> [Review]
    -Clean -> (Wrap up)
```
- Diagram summary: Start with Onboard, then Build, then Review, then Test. After testing, reflect: if more features are desired, loop back to Build. If done, push and check SonarCloud — if issues surfaced, Review again; if clean, Wrap Up.

### Improving AI scaffolding
- Examples: [transcripts](https://github.com/amokprime/linebyline/tree/main/ai/z-ai-glm/skills/chat)
```dgmo
flowchart
direction-lr
(Onboard) -> [Skills] -Push -> <SonarCloud?>
  -Issues -> [[#Remediating latent Sonar issues]]
  -Clean -> (Wrap up)
```
- Diagram summary: Start with Onboard, then Skills (meta-session for updating agent scaffolding). After Skills work, push and check SonarCloud — if issues surfaced, go to the latent Sonar remediation workflow; if clean, Wrap Up.

### Remediating latent Sonar issues
- Sometimes new SonarCloud issues appear with the same code that passed. Examples: commits in late July 2026 after a ~1 month absence caused package versions to become outdated and app code smells to emerge (possibly due to updated Sonar definitions)
```dgmo
flowchart
direction-lr
(Onboard) -> [Review] -> [Test]
-Push -> <SonarCloud?>
  -Issues -> [Review]
  -Clean -> (Wrap up)
```
- Diagram summary: Start with Onboard, then Review (using the review skills), then Test. Push and check SonarCloud — if issues remain, Review again; if clean, Wrap Up.

### Improving Playwright tests
- Examples: [transcripts](https://github.com/amokprime/linebyline/tree/main/tests/chat)
```dgmo
flowchart
direction-lr
(Onboard) -> [Test] -Push -> <SonarCloud?>
  -Issues -> [Review] -> [Test]
  -Clean -> (Wrap up)
```
- Diagram summary: Start with Onboard, then Test. Push and check SonarCloud — if issues surfaced, Review then Test again; if clean, Wrap Up.

### Researching and implementing high-level plans
- Example of a high-level plan: [[archive/modular/plan/0-Roadmap|0-Roadmap]]. The exact content of steps could vary a lot. What is likely regardless:
	- Proposals start out with half-baked criteria and become more refined in followup turns or even sessions
	- Investigations need web searches to rule out alternatives or explore overlooked options, and manual followups for taste or to access material behind login portals
	- One idea often leads to another within the same session. This produces large buckets of proposed items for the agent to triage later.

```dgmo
flowchart
direction-lr
(Onboard) -> [Propose] -> [Investigate] -> [Plan] -> <Doable now?>
  -No -> [Split into stages to propose separately] -> (Wrap Up)
  -Yes -> [Attempt] -> <Worked?>
    -No -> [Investigate]
    -Yes -> <More ideas?>
      -No -> (Wrap Up)
      -Yes -> [Propose]
```
- Diagram summary: Start with Onboard, then Propose, then Investigate, then Plan. At the Plan stage, decide if the idea is doable now — if not, split it into stages and Wrap Up. If doable, Attempt it. If the attempt failed, go back to Investigate. If it worked, consider requesting more ideas — if yes, loop back to Propose; if no, Wrap Up.