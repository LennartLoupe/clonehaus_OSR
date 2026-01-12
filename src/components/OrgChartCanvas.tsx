'use client';

export type NodeType = 'ORGANIZATION' | 'DOMAIN' | 'AGENT';

export interface NodeData {
    id: string;
    label: string;
    type: NodeType;
    children?: NodeData[];
}

interface OrgChartCanvasProps {
    data: NodeData;
    selectedNodeId: string | null;
    onNodeSelect: (node: NodeData) => void;
}

export function OrgChartCanvas({
    data,
    selectedNodeId,
    onNodeSelect,
}: OrgChartCanvasProps) {
    if (!data) {
        return (
            <div style={{ color: 'white', padding: 20 }}>
                OrgChartCanvas received no data.
            </div>
        );
    }

    return (
        <div style={{ color: 'white' }}>
            <TreeNode
                node={data}
                selectedNodeId={selectedNodeId}
                onNodeSelect={onNodeSelect}
            />
        </div>
    );
}

function TreeNode({
    node,
    selectedNodeId,
    onNodeSelect,
}: {
    node: NodeData;
    selectedNodeId: string | null;
    onNodeSelect: (node: NodeData) => void;
}) {
    const isSelected = selectedNodeId === node.id;

    return (
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
            {/* CLICKABLE NODE BOX */}
            <div
                onClick={() => {
                    console.log('Clicked node:', node);
                    onNodeSelect(node);
                }}
                style={{
                    display: 'inline-block',
                    padding: '12px 16px',
                    border: '1px solid white',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: isSelected ? '#333' : '#000',
                    marginBottom: 12,
                    minWidth: 160,
                }}
            >
                <div style={{ fontWeight: 600 }}>{node.label}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{node.type}</div>
            </div>

            {/* CHILDREN */}
            {node.children && node.children.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 24,
                        marginTop: 16,
                        flexWrap: 'wrap',
                    }}
                >
                    {node.children.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            selectedNodeId={selectedNodeId}
                            onNodeSelect={onNodeSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}