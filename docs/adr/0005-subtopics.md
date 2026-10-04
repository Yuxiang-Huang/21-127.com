# Subtopics are the home-page slice

The Functions home card listed every Definition, Technique, Theorem, and Problem. That grain is too fine: the handout's sections are the slices a reader chooses. A Topic is an ordered list of Subtopics, the home card lists those names, and an entry's address is `/{topic}/{subtopic}/{kind}/{slug}`. Tex stays at `{topic}/{kind}/{slug}.tex` because a kind's slugs are unique across the Topic; the Subtopic is a placement in `topic.yaml`. Functions is Binary Relations, Fundamentals, Images and Preimages, Jections, and Composition and Inverses.

## Considered Options

- Addresses without the Subtopic. Rejected: the address should name the slice the reader is in.
- Splitting Composition and Inverses. Rejected: the handout treats them as one section, and the identity laws sit across both.
