# chat-frontend Specification (delta — additive)

## ADDED Requirements

### Requirement: sendMessage accepts file_ids

The `frontend/src/api/chats.ts` `sendMessage` function SHALL
accept an optional `file_ids: number[]` field on its
`input` argument. When present, the request body posted to
`POST /api/chats/:id/messages` SHALL include the
`file_ids` field. The function's success / failure behavior
is unchanged: it still returns the discriminated union
`{ ok: true, value: ChatWithMessages }` /
`{ ok: false, error: string, chat: ChatWithMessages }` /
throws `Error(serverErrorMessage)`.

The `ChatMessage` type SHALL include a `file_ids: number[]`
field (defaulting to `[]` when absent on the wire) and an
`attachments: AssistantAttachment[]` field (defaulting to
`[]` when absent on the wire). The shape of
`AssistantAttachment` SHALL match the backend's
`AssistantAttachment` interface (see `chat-api` ADDED
Requirements: `filename`, `mime_type`, `content_b64?`,
`content_text?`).

#### Scenario: sendMessage posts file_ids

- **WHEN**
  `sendMessage(1, { content: 'See attached', file_ids: [42, 43] })`
  is called
- **THEN** a `POST` is sent to `/api/chats/1/messages` with
  the JSON body containing
  `file_ids: [42, 43]`

#### Scenario: sendMessage without file_ids is unchanged

- **WHEN** `sendMessage(1, { content: 'hi' })` is called
- **THEN** a `POST` is sent to `/api/chats/1/messages` with
  the JSON body that does NOT contain a `file_ids` field
- **AND** the server default of `file_ids: []` is applied

#### Scenario: returned messages include file_ids

- **WHEN** the server returns 200 with a `ChatWithMessages`
  body whose user message has `file_ids = [42, 43]`
- **THEN** the resolved `value.messages` array includes
  that message with `file_ids = [42, 43]`

#### Scenario: returned messages include attachments

- **WHEN** the server returns 200 with a `ChatWithMessages`
  body whose assistant message has one attachment
- **THEN** the resolved `value.messages` array includes
  that message with `attachments = [<attachment>]`

#### Scenario: returned messages default file_ids and attachments

- **WHEN** the server returns 200 with a message that
  omits both `file_ids` and `attachments` on the wire
- **THEN** the message has `file_ids = []` and
  `attachments = []`
