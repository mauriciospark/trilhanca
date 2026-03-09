# Offline-first e Sincronização

## Princípios

- App funciona integralmente sem internet; todas as operações persistem localmente.
- Sincronização é oportunística e incremental.

## Banco de Dados

- Realm para modelo local, transações rápidas e schemas versionados.
- Objetos principais: Veículo, Posição, Mensagem, Configuração.

## Estratégias de Sync

- Nearby para sync entre integrantes em campo.
- Internet para backup/replicação quando disponível.

## Conflitos

- Resolução por timestamp e prioridade do líder.

## Armazenamento de Mídia

- Áudio PTT armazenado de forma temporária; limpeza programada.

## Privacidade

- Dados pessoais e localização tratados com mínimo necessário e controle do usuário.
