// Flowchart Grammar (Peggy.js)
// Syntax: Start -> [Process 1] -> {Decision?} -> [Process 2] -> End
//         Decision {Decision?} --Yes--> [Process 3]
//         Decision {Decision?} --No--> [Process 4]

File = _ st:Statement _ { return st; }

Statement = nodes:NodeDefs edges:EdgeList { return { nodes, edges }; }

NodeDefs = head:Node _ next:( "," _ Node )* { return [head, ...next.map(n => n[2])]; }

Node = id:ID _ type:NodeType _ text:String { return { id, type, text }; }

NodeType = "start" / "process" / "decision" / "end"

EdgeList = head:Edge _ next:( ";" _ Edge )* { return [head, ...next.map(e => e[2])]; }

Edge = from:ID _ "-->" _ label:("(" ID ")")? _ to:ID { return { from, to, label: label ? label[1] : "" }; }

String = '"' chars:[^"]* '"' { return chars.join(""); }
ID = [a-zA-Z0-9_]+ { return text(); }
_ "whitespace" = [ \t\n\r]*
