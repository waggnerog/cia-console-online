export type VisitStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export type FieldTask = {
  id: string;
  operation_id: string;
  title: string;
  instructions: string | null;
  min_photos: number | null;
  max_photos: number | null;
  required: boolean;
  criteria: Record<string, boolean> | null;
};

export type Evidence = {
  id: string;
  visit_id: string;
  photo_task_id: string;
  status: string;
  storage_path: string | null;
  captured_at: string | null;
};

export type Visit = {
  id: string;
  workspace_id: string;
  operation_id: string;
  store_id: string;
  scheduled_for: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: VisitStatus;
  store: {
    id: string;
    name: string;
    code: string | null;
    network: string | null;
    region: string | null;
    address: string | null;
  } | null;
  operation: {
    id: string;
    name: string;
    client_name: string | null;
  } | null;
  tasks: FieldTask[];
  evidences: Evidence[];
};

export type Membership = {
  workspace_id: string;
  role: string;
  display_name: string | null;
  workspace: {
    id: string;
    name: string;
    settings: { timezone?: string } | null;
  } | null;
};

export type QueueItem =
  | {
      id: string;
      kind: 'checkin' | 'checkout';
      createdAt: string;
      visitId: string;
      workspaceId: string;
      latitude: number | null;
      longitude: number | null;
    }
  | {
      id: string;
      kind: 'evidence';
      createdAt: string;
      visitId: string;
      workspaceId: string;
      operationId: string;
      storeId: string;
      taskId: string;
      localUri: string;
      mimeType: string;
      originalFileName: string;
      capturedAt: string;
    };
