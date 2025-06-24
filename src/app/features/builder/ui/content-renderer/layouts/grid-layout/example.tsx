// import React, { useState } from "react";
// import {
//   DndContext,
//   closestCenter,
//   PointerSensor,
//   useSensor,
//   useSensors,
// } from "@dnd-kit/core";
// import {
//   arrayMove,
//   SortableContext,
//   useSortable,
//   rectSortingStrategy,
// } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";

// const defaultItems = ["A", "B", "C", "D", "E", "F", "G", "H"];

// function SortableItem({ id }: { id: string }) {
//   const { attributes, listeners, setNodeRef, transform, transition } =
//     useSortable({ id });

//   const style: React.CSSProperties = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     padding: "1.5rem",
//     fontSize: "1.5rem",
//     background: "#f0f0f0",
//     border: "1px solid #ccc",
//     borderRadius: "0.5rem",
//     textAlign: "center",
//     cursor: "grab",
//   };

//   return (
//     <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
//       {id}
//     </div>
//   );
// }

// export default function DragAndDropGrid() {
//   const [items, setItems] = useState(defaultItems);

//   const sensors = useSensors(useSensor(PointerSensor));

//   const handleDragEnd = (event: any) => {
//     const { active, over } = event;

//     if (active.id !== over.id) {
//       const oldIndex = items.indexOf(active.id);
//       const newIndex = items.indexOf(over.id);

//       setItems((items) => arrayMove(items, oldIndex, newIndex));
//     }
//   };

//   return (
//     <div className="p-6">
//       <h2 className="text-xl font-semibold mb-4">Dnd Kit Grid</h2>
//       <DndContext
//         sensors={sensors}
//         collisionDetection={closestCenter}
//         onDragEnd={handleDragEnd}
//       >
//         <SortableContext items={items} strategy={rectSortingStrategy}>
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
//               gap: "1rem",
//             }}
//           >
//             {items.map((id) => (
//               <SortableItem key={id} id={id} />
//             ))}
//           </div>
//         </SortableContext>
//       </DndContext>
//     </div>
//   );
// }
