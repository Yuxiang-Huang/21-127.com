import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { stringify } from "yaml";

type Wrong = Record<number, string[]>;

function write(path: string, parts: string[], wrong: Wrong) {
	const statement = parts.join("");
	const dollars = statement.split("$").length - 1;
	if (dollars % 2 !== 0) throw new Error(`${path}: odd dollar count`);
	for (const [index, choices] of Object.entries(wrong)) {
		if (choices.includes(parts[Number(index)])) {
			throw new Error(`${path}: choice repeats part ${index}`);
		}
	}
	const file = `21-127.com-data/${path}`;
	mkdirSync(dirname(file), { recursive: true });
	const indexed = Object.fromEntries(parts.map((text, index) => [index, text]));
	writeFileSync(file, stringify({ parts: indexed, wrong }));
}

write("functions/definitions/bijection.yaml", [
	"Let $A$ and $B$ be sets, and let ",
	"$f : A \\to B$",
	" be a function. $f$ is a ",
	"bijection",
	" if and only if $f$ is both an ",
	"injection",
	" and a ",
	"surjection",
	".",
], {
	1: ["$f : B \\to A$", "$f : A \\to A$", "$f \\subseteq A \\times B$"],
	3: ["injection", "surjection", "relation"],
	5: ["surjection", "bijection", "function"],
	7: ["injection", "bijection", "relation"],
});

write("functions/definitions/binary-relation.yaml", [
	"If ",
	"$R \\subseteq S \\times T$",
	", then $R$ is a binary relation between ",
	"$S$",
	" and ",
	"$T$",
	". $S$ is the ",
	"domain",
	" of $R$, and $T$ is the ",
	"codomain",
	" of $R$.",
], {
	1: ["$R \\subseteq S \\cup T$", "$R \\supseteq S \\times T$", "$R \\in S \\times T$"],
	3: ["$T$", "$R$", "$a$"],
	5: ["$S$", "$R$", "$b$"],
	7: ["codomain", "image", "range"],
	9: ["domain", "image", "preimage"],
});

write("functions/definitions/composition.yaml", [
	"Let $A$, $B$, and $C$ be sets, and let $f : A \\to B$ and $g : B \\to C$ be functions. The composition of ",
	"$g$",
	" and ",
	"$f$",
	" is the function $k : A \\to C$ defined by ",
	"$k(a) = g(f(a))$",
	" for all $a \\in A$. We denote this by ",
	"$k = g \\circ f$",
	".",
], {
	1: ["$f$", "$k$", "$A$"],
	3: ["$g$", "$k$", "$C$"],
	5: ["$k(a) = f(g(a))$", "$k(a) = g(a)$", "$k(a) = f(a)$"],
	7: ["$k = f \\circ g$", "$k = g \\circ k$", "$k = f \\circ f$"],
});

write("functions/definitions/function-equality.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ and $g : A \\to B$ be functions. Then ",
	"$f = g$",
	" if and only if ",
	"$\\forall a \\in A$",
	", ",
	"$f(a) = g(a)$",
	".",
], {
	1: ["$f \\subseteq g$", "$f \\circ g = \\mathrm{Id}_A$", "$f^{-1} = g$"],
	3: ["$\\exists a \\in A$", "$\\forall a \\in B$", "$\\forall b \\in B$"],
	5: ["$f(a) = a$", "$g(a) = a$", "$f(g(a)) = a$"],
});

write("functions/definitions/function.yaml", [
	"Let ",
	"$A$",
	" and ",
	"$B$",
	" be sets, and let $f$ be a binary relation between $A$ and $B$. We say that $f$ is a function from $A$ to $B$, denoted $f : A \\to B$, if and only if ",
	"for each",
	" $a \\in A$, ",
	"there exists",
	" a unique $b \\in B$ such that $(a,b) \\in f$.",
], {
	1: ["$B$", "$f$", "$a$"],
	3: ["$A$", "$f$", "$b$"],
	5: ["there exists", "for all", "there is"],
	7: ["for each", "for all", "for every"],
});

write("functions/definitions/identity-function.yaml", [
	"$\\mathrm{Id}_S : S \\to S$",
	" such that for all ",
	"$x \\in S$",
	", ",
	"$\\mathrm{Id}_S(x) = x$",
	".",
], {
	0: ["$\\mathrm{Id}_S : S \\to T$", "$\\mathrm{Id}_T : S \\to S$", "$S : S \\to S$"],
	2: ["$x \\in T$", "$s \\in S$", "$x \\subseteq S$"],
	4: ["$\\mathrm{Id}_S(x) = S$", "$\\mathrm{Id}_S(x) = 0$", "$\\mathrm{Id}_x(S) = x$"],
});

write("functions/definitions/image.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ be a function. For any subset ",
	"$X \\subseteq A$",
	", the image of $X$ under $f$, denoted ",
	"$\\mathrm{Im}_f(X)$",
	", is ",
	"$\\{ b \\in B \\mid \\exists a \\in X,\\ f(a) = b \\}$",
	".",
], {
	1: ["$X \\subseteq B$", "$X \\supseteq A$", "$X \\in A$"],
	3: ["$\\mathrm{PreIm}_f(X)$", "$\\mathrm{Im}_X(f)$", "$f(X)$"],
	5: ["$\\{ a \\in A \\mid \\exists b \\in X,\\ f(b) = a \\}$", "$\\{ b \\in B \\mid \\forall a \\in X,\\ f(a) = b \\}$", "$\\{ b \\in A \\mid \\exists a \\in B,\\ f(a) = b \\}$"],
});

write("functions/definitions/injection.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ be a function. $f$ is ",
	"injective",
	" if and only if for all $x, y \\in A$, if ",
	"$f(x) = f(y)$",
	", then ",
	"$x = y$",
	".",
], {
	1: ["surjective", "bijective", "invertible"],
	3: ["$f(x) \\neq f(y)$", "$x = y$", "$f(x) = y$"],
	5: ["$x \\neq y$", "$f(x) = f(y)$", "$x \\in y$"],
});

write("functions/definitions/inverse.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ and ",
	"$g : B \\to A$",
	" be functions. $g$ is a two-sided inverse of $f$ if and only if $g$ is both a ",
	"left",
	" and a ",
	"right",
	" inverse.",
], {
	1: ["$g : A \\to B$", "$g : B \\to B$", "$g : A \\to A$"],
	3: ["right", "two-sided", "inverse"],
	5: ["left", "two-sided", "identity"],
});

write("functions/definitions/invertible.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ be a function. $f$ is ",
	"invertible",
	" if and only if $f$ has a two-sided inverse. We denote its inverse function by ",
	"$f^{-1}$",
	".",
], {
	1: ["injective", "surjective", "well-defined"],
	3: ["$f$", "$f \\circ f$", "$\\mathrm{Id}_f$"],
});

write("functions/definitions/left-inverse.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ and $g : B \\to A$ be functions. $g$ is a ",
	"left",
	" inverse of $f$ if and only if ",
	"$g \\circ f = \\mathrm{Id}_A$",
	".",
], {
	1: ["right", "two-sided", "identity"],
	3: ["$f \\circ g = \\mathrm{Id}_B$", "$g \\circ f = \\mathrm{Id}_B$", "$f \\circ g = \\mathrm{Id}_A$"],
});

write("functions/definitions/preimage.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ be a function. For any subset ",
	"$Y \\subseteq B$",
	", the preimage of $Y$ under $f$, denoted ",
	"$\\mathrm{PreIm}_f(Y)$",
	", is ",
	"$\\{ a \\in A \\mid f(a) \\in Y \\}$",
	".",
], {
	1: ["$Y \\subseteq A$", "$Y \\supseteq B$", "$Y \\in B$"],
	3: ["$\\mathrm{Im}_f(Y)$", "$\\mathrm{PreIm}_Y(f)$", "$f^{-1}$"],
	5: ["$\\{ b \\in B \\mid f(b) \\in Y \\}$", "$\\{ a \\in A \\mid a \\in Y \\}$", "$\\{ a \\in Y \\mid f(a) \\in A \\}$"],
});

write("functions/definitions/right-inverse.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ and $g : B \\to A$ be functions. $g$ is a ",
	"right",
	" inverse of $f$ if and only if ",
	"$f \\circ g = \\mathrm{Id}_B$",
	".",
], {
	1: ["left", "two-sided", "identity"],
	3: ["$g \\circ f = \\mathrm{Id}_A$", "$f \\circ g = \\mathrm{Id}_A$", "$g \\circ f = \\mathrm{Id}_B$"],
});

write("functions/definitions/surjection.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ be a function. $f$ is ",
	"surjective",
	" if and only if ",
	"$\\mathrm{Im}_f(A) = B$",
	". That is, ",
	"$\\forall b \\in B,\\ \\exists a \\in A$",
	" such that $f(a) = b$.",
], {
	1: ["injective", "bijective", "invertible"],
	3: ["$\\mathrm{Im}_f(B) = A$", "$\\mathrm{PreIm}_f(A) = B$", "$\\mathrm{Im}_f(A) \\subseteq B$"],
	5: ["$\\exists b \\in B,\\ \\forall a \\in A$", "$\\forall a \\in A,\\ \\exists b \\in B$", "$\\forall b \\in A,\\ \\exists a \\in B$"],
});

write("functions/definitions/well-defined-function.yaml", [
	"A mapping $f : A \\to B$ is a well-defined function if and only if it satisfies totality, existence, and uniqueness. Totality: ",
	"for all",
	" $a \\in A$, $f(a)$ is defined. Existence: for all $a \\in A$, ",
	"$f(a) \\in B$",
	". Uniqueness: for all $a \\in A$, $f(a)$ is ",
	"uniquely",
	" defined.",
], {
	1: ["there exists", "there is", "for some"],
	3: ["$f(a) \\in A$", "$a \\in B$", "$f(b) \\in A$"],
	5: ["arbitrarily", "partially", "twice"],
});

write("functions/techniques/disprove-injective.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ be a function. To disprove $f$ is injective: find $x, y \\in A$ such that ",
	"$f(x) = f(y)$",
	" and ",
	"$x \\neq y$",
	".",
], {
	1: ["$f(x) \\neq f(y)$", "$x = y$", "$f(x) = x$"],
	3: ["$x = y$", "$f(x) \\neq f(y)$", "$x \\in y$"],
});

write("functions/techniques/disprove-surjective.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ be a function. To disprove $f$ is surjective: find ",
	"$b \\in B$",
	" such that ",
	"$f(a) \\neq b$",
	" for all ",
	"$a \\in A$",
	".",
], {
	1: ["$a \\in A$", "$b \\in A$", "$b \\subseteq B$"],
	3: ["$f(a) = b$", "$f(b) \\neq a$", "$a \\neq b$"],
	5: ["$b \\in B$", "$a \\in B$", "$a \\subseteq A$"],
});

write("functions/techniques/prove-bijective-by-inverse.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ be a function. To prove $f$ is bijective, show that $f$ is invertible: construct ",
	"$g : B \\to A$",
	" and prove it is well-defined. Prove that ",
	"$f \\circ g = \\mathrm{Id}_B$",
	" and ",
	"$g \\circ f = \\mathrm{Id}_A$",
	". Conclude that ",
	"$g = f^{-1}$",
	".",
], {
	1: ["$g : A \\to B$", "$g : B \\to B$", "$f : B \\to A$"],
	3: ["$g \\circ f = \\mathrm{Id}_A$", "$f \\circ g = \\mathrm{Id}_A$", "$g \\circ f = \\mathrm{Id}_B$"],
	5: ["$f \\circ g = \\mathrm{Id}_B$", "$g \\circ f = \\mathrm{Id}_B$", "$f \\circ g = f$"],
	7: ["$f = g^{-1}$", "$g = f$", "$g = \\mathrm{Id}_A$"],
});

write("functions/techniques/prove-bijective.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ be a function. To prove $f$ is ",
	"bijective",
	": show that $f$ is both an ",
	"injection",
	" and a ",
	"surjection",
	".",
], {
	1: ["injective", "surjective", "invertible"],
	3: ["surjection", "bijection", "relation"],
	5: ["injection", "bijection", "function"],
});

write("functions/techniques/prove-injective.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ be a function. To prove $f$ is injective: let $x, y \\in A$ such that ",
	"$f(x) = f(y)$",
	". Show that ",
	"$x = y$",
	".",
], {
	1: ["$x = y$", "$f(x) \\neq f(y)$", "$x \\neq y$"],
	3: ["$x \\neq y$", "$f(x) = f(y)$", "$f(x) = y$"],
});

write("functions/techniques/prove-surjective.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ be a function. To prove $f$ is surjective: let ",
	"$b \\in B$",
	". Show that there exists ",
	"$a \\in A$",
	" such that ",
	"$f(a) = b$",
	".",
], {
	1: ["$a \\in A$", "$b \\in A$", "$b \\subseteq B$"],
	3: ["$b \\in B$", "$a \\in B$", "$a \\subseteq A$"],
	5: ["$f(b) = a$", "$f(a) \\neq b$", "$a = b$"],
});

write("functions/theorems/composition-associativity.yaml", [
	"Let $A$, $B$, $C$, and $D$ be sets, and let ",
	"$f : A \\to B$",
	", ",
	"$g : B \\to C$",
	", and ",
	"$h : C \\to D$",
	" be functions. Then ",
	"$h \\circ (g \\circ f) = (h \\circ g) \\circ f$",
	".",
], {
	1: ["$f : B \\to A$", "$f : A \\to C$", "$f : C \\to D$"],
	3: ["$g : C \\to B$", "$g : A \\to B$", "$g : B \\to D$"],
	5: ["$h : D \\to C$", "$h : B \\to C$", "$h : A \\to B$"],
	7: ["$(h \\circ g) \\circ f = h \\circ (f \\circ g)$", "$f \\circ (g \\circ h) = (f \\circ g) \\circ h$", "$h \\circ (f \\circ g) = (h \\circ f) \\circ g$"],
});

write("functions/theorems/composition-preserves-jections.yaml", [
	"Let $A$, $B$, and $C$ be sets, and let $f : A \\to B$ and $g : B \\to C$ be functions. If $f$ and $g$ are injections, then ",
	"$g \\circ f$",
	" is an injection. If $f$ and $g$ are surjections, then $g \\circ f$ is a ",
	"surjection",
	". If $f$ and $g$ are bijections, then $g \\circ f$ is a ",
	"bijection",
	".",
], {
	1: ["$f \\circ g$", "$g \\circ g$", "$f \\circ f$"],
	3: ["injection", "bijection", "function"],
	5: ["injection", "surjection", "relation"],
});

write("functions/theorems/identity-laws.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ be a function. Then ",
	"$\\mathrm{Id}_B \\circ f = f$",
	" and ",
	"$f \\circ \\mathrm{Id}_A = f$",
	".",
], {
	1: ["$\\mathrm{Id}_A \\circ f = f$", "$f \\circ \\mathrm{Id}_B = f$", "$\\mathrm{Id}_B \\circ f = \\mathrm{Id}_B$"],
	3: ["$f \\circ \\mathrm{Id}_B = f$", "$\\mathrm{Id}_A \\circ f = f$", "$f \\circ \\mathrm{Id}_A = \\mathrm{Id}_A$"],
});

write("functions/theorems/image-of-intersection.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ be a function. For any ",
	"$S, T \\in \\mathcal{P}(A)$",
	", ",
	"$\\mathrm{Im}_f(S \\cap T) \\subseteq \\mathrm{Im}_f(S) \\cap \\mathrm{Im}_f(T)$",
	".",
], {
	1: ["$S, T \\in \\mathcal{P}(B)$", "$S, T \\subseteq A$", "$S \\cap T \\in \\mathcal{P}(A)$"],
	3: ["$\\mathrm{Im}_f(S \\cap T) = \\mathrm{Im}_f(S) \\cap \\mathrm{Im}_f(T)$", "$\\mathrm{Im}_f(S) \\cap \\mathrm{Im}_f(T) \\subseteq \\mathrm{Im}_f(S \\cap T)$", "$\\mathrm{Im}_f(S \\cup T) \\subseteq \\mathrm{Im}_f(S) \\cup \\mathrm{Im}_f(T)$"],
});

write("functions/theorems/invertible-iff-bijection.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ be a function. $f$ is ",
	"invertible",
	" if and only if $f$ is a ",
	"bijection",
	".",
], {
	1: ["injective", "surjective", "well-defined"],
	3: ["injection", "surjection", "function"],
});

write("functions/theorems/preimage-of-intersection.yaml", [
	"Let $A$ and $B$ be sets, and let $f : A \\to B$ be a function. For any ",
	"$S, T \\in \\mathcal{P}(B)$",
	", ",
	"$\\mathrm{PreIm}_f(S \\cap T) = \\mathrm{PreIm}_f(S) \\cap \\mathrm{PreIm}_f(T)$",
	".",
], {
	1: ["$S, T \\in \\mathcal{P}(A)$", "$S, T \\subseteq B$", "$S \\cap T \\in \\mathcal{P}(B)$"],
	3: ["$\\mathrm{PreIm}_f(S \\cap T) \\subseteq \\mathrm{PreIm}_f(S) \\cap \\mathrm{PreIm}_f(T)$", "$\\mathrm{Im}_f(S \\cap T) = \\mathrm{Im}_f(S) \\cap \\mathrm{Im}_f(T)$", "$\\mathrm{PreIm}_f(S \\cup T) = \\mathrm{PreIm}_f(S) \\cup \\mathrm{PreIm}_f(T)$"],
});

write("functions/theorems/uniqueness-of-inverses.yaml", [
	"Let $f$ be an ",
	"invertible",
	" function. Then its inverse function ",
	"$f^{-1}$",
	" is ",
	"unique",
	".",
], {
	1: ["injective", "surjective", "constant"],
	3: ["$f$", "$f \\circ f$", "$\\mathrm{Id}$"],
	5: ["an injection", "a surjection", "well-defined"],
});
