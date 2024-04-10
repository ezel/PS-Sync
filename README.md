## PS-Sync
sync [PokemonShowdown](https://play.pokemonshowdown.com/)'s team with your webdav

```mermaid
---
title: Sync (manual click)
---
flowchart LR
    local1[Teams on PS]
    remote1[WebDav: /team.txt]
    local1 -- Backup Button --> remote1
    remote1 -- Restore Button --> local1
```

```mermaid
---
title: Archive (manual click)
---
flowchart LR
    local1[One Team on PS]
    remote1[WebDav: /arch.txt]
    local1 -- Archive Button --> remote1
    remote1 -- Unarchive Button --> local1
```

## Code Structure
### 1. Sync part
```mermaid
%%{init: { "sequence": { "mirrorActors":false }}}%%
sequenceDiagram
    Extension->>PS: {command: load team} 
    PS-->>Extension: data: teams info!
    destroy PS
    create participant WebDav
    Extension->>WebDav: Save the data
```
### 2. Arch part
Similar to the sync part

## Built With
* [WebDav](https://github.com/perry-mitchell/webdav-client)
``` sh
npm run build:web
```

``` javascript
 output: {
    environment: { module: false },
    library: { type: "window", name: 'WebDAV' }
}
```