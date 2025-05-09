
import { NextResponse, type NextRequest } from 'next/server';
import type { UpdateClientPayload } from '@/types';
import { serverClients, findClientById, updateClientOnServer, deleteClientFromServer, refreshClientAIInsights } from '@/lib/api-utils';

interface Params { params: { id: string } }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const client = findClientById(params.id);
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: `Failed to fetch client: ${errorMessage}` }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = await request.json() as UpdateClientPayload;
    let updatedClient = updateClientOnServer(params.id, payload);

    if (!updatedClient) {
      return NextResponse.json({ success: false, error: 'Client not found for update' }, { status: 404 });
    }

    // Refresh AI insights after update
    try {
      const aiData = await refreshClientAIInsights(updatedClient);
      updatedClient = { ...updatedClient, ...aiData };
      // Update client in serverClients array with AI data
       const clientIndex = serverClients.findIndex(c => c.id === updatedClient!.id);
      if (clientIndex !== -1) {
        serverClients[clientIndex] = updatedClient;
      }
    } catch (aiError) {
       console.warn(`AI insights for updated client ${updatedClient.id} failed: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
      // Client is updated, AI data can be refreshed later
    }
    
    return NextResponse.json({ success: true, data: updatedClient });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error in PUT /api/clients/${params.id}:`, error);
    return NextResponse.json({ success: false, error: `Failed to update client: ${errorMessage}` }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const success = deleteClientFromServer(params.id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Client not found for deletion' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: `Failed to delete client: ${errorMessage}` }, { status: 500 });
  }
}
