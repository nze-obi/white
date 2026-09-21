# Nobus API Coverage

Generated from the supplied OpenAPI 3.1 specification.

## Summary

- Paths: **94**
- Operations: **148**
- Schemas: **236**

Every operation below is loaded into the schema-driven API Workbench. Primary resources also have dedicated console pages.

## Operations by domain

- `network`: 56
- `volume`: 36
- `instance`: 30
- `fos`: 9
- `auth`: 5
- `app-credentials`: 5
- `keypair`: 3
- `project`: 2
- `flavor`: 1
- `image`: 1

## Complete operation inventory

| Method | Path | Summary | Tag |
|---|---|---|---|
| POST | `/api/v3/auth/login/initiate` | Initiate Login View | Initiate Login |
| POST | `/api/v3/auth/login/complete` | Complete Login View | Complete Login |
| POST | `/api/v3/auth/api-key` | Get Api Key View | Get API Key |
| DELETE | `/api/v3/auth/api-key` | Invalidate Api Key View | Invalidate API Key |
| POST | `/api/v3/auth/api-key/refresh` | Refresh Api Key View | Refresh API Key |
| GET | `/api/v3/instance` | Get Instance Api | Instance - Get instance |
| POST | `/api/v3/instance` | Create Instance Api | Instance - Create Instance |
| DELETE | `/api/v3/instance` | Delete Instance Api | Instance - Delete instance |
| GET | `/api/v3/instance/list` | List Instance Api | Instance - List instances |
| POST | `/api/v3/instance/shutdown` | Shutdown Instance Api | Instance - ShutDown Instance |
| GET | `/api/v3/instance/network-interfaces` | List Network Interfaces Api | Instance - List Network Interfaces |
| GET | `/api/v3/instance/diagnostics` | Get Server Diagnostics Api | Instance - Get Server Diagnostics |
| GET | `/api/v3/instance/security-groups` | List Security Groups Api | Instance - List Security Groups |
| GET | `/api/v3/instance/tags` | List Tags Api | Instance - List Tags |
| GET | `/api/v3/instance/topology` | Get Topology Api | Instance - Get Topology |
| POST | `/api/v3/instance/clear-password` | Clear Password Api | Instance - Clear Password |
| POST | `/api/v3/instance/confirm-resize` | Confirm Resize Api | Instance - Confirm Resize |
| POST | `/api/v3/instance/revert-resize` | Revert Resize Api | Instance - Revert Resize |
| POST | `/api/v3/instance/unlock-instance` | Unlock Instance Api | Instance - Unlock Instance |
| POST | `/api/v3/instance/lock-instance` | Lock Instance Api | Instance - Lock Instance |
| POST | `/api/v3/instance/suspend-instance` | Suspend Instance Api | Instance - Suspend Instance |
| POST | `/api/v3/instance/resume-instance` | Resume Instance Api | Instance - Resume Instance |
| POST | `/api/v3/instance/get-console-output` | Get Server Console Output Api | Instance - Get Console Output |
| POST | `/api/v3/instance/get-console-url` | Get Console Url Api | Instance - Get Console URL |
| POST | `/api/v3/instance/attach-network-interface` | Attach Network Interface Api | Instance - Attach Network Interface |
| POST | `/api/v3/instance/detach-network-interface` | Detach Network Interface Api | Instance - Detach Network Interface |
| POST | `/api/v3/instance/reboot-server` | Reboot Server Api | Instance - Reboot Server |
| POST | `/api/v3/instance/attach-security-group` | Attach Security Group Api | Instance - Attach Security Group |
| POST | `/api/v3/instance/remove-security-group` | Remove Security Group Api | Instance - Remove Security Group |
| POST | `/api/v3/instance/resize` | Resize Api | Instance - Resize |
| POST | `/api/v3/instance/create-server-image` | Create Server Image Api | Instance - Create Server Image |
| POST | `/api/v3/instance/change-server-password` | Change Server Password Api | Instance - Change Server Password |
| POST | `/api/v3/instance/set-tags` | Set Tags Api | Instance - Set Tags |
| POST | `/api/v3/instance/delete-tags` | Delete Tags Api | Instance - Delete Tags |
| POST | `/api/v3/instance/update-server` | Update Server Api | Instance - Update Server |
| POST | `/api/v3/network/` | Create Network Api | Network - Create |
| PUT | `/api/v3/network/` | Update Network Api | Network - Update |
| DELETE | `/api/v3/network/` | Delete Network Api | Network - Delete |
| GET | `/api/v3/network/` | Get Network Api | Network - Get |
| POST | `/api/v3/network/only` | Create Only Network Api | Network - Create Standalone |
| GET | `/api/v3/network/list` | New List Network Api | Network - List |
| POST | `/api/v3/network/subnet` | Create Subnet Api | Network - Create Subnet |
| PUT | `/api/v3/network/subnet` | Update Subnet Api | Network - Update Subnet |
| DELETE | `/api/v3/network/subnet` | Delete Subnet Api | Network - Delete Subnet |
| GET | `/api/v3/network/subnet` | Get Subnet Api | Network - Get Subnet |
| GET | `/api/v3/network/subnet/list` | List Subnet Api | Network - List Subnets |
| POST | `/api/v3/network/port` | Create Port Api | Network - Create Port |
| PUT | `/api/v3/network/port` | Update Port Api | Network - Update Port |
| DELETE | `/api/v3/network/port` | Delete Port Api | Network - Delete Port |
| GET | `/api/v3/network/port` | Get Port Api | Network - Get Port |
| GET | `/api/v3/network/port/list` | List Port Api | Network - List Ports |
| POST | `/api/v3/network/port/clear-address-pairs` | Clear Port Address Pairs Api | Network - Clear Port Address Pairs |
| POST | `/api/v3/network/port/address-pairs` | Set Port Address Pairs Api | Network - Set Port Address Pairs |
| POST | `/api/v3/network/router` | Create Router Api | Network - Create Router |
| PUT | `/api/v3/network/router` | Update Router Api | Network - Update Router |
| DELETE | `/api/v3/network/router` | Delete Router Api | Network - Delete Router |
| GET | `/api/v3/network/router` | Get Router Api | Network - Get Router |
| GET | `/api/v3/network/router/list` | List Router Api | Network - List Routers |
| POST | `/api/v3/network/router/add-interface` | Add Router Interface Api | Network - Add Router Interface |
| DELETE | `/api/v3/network/router/remove-interface` | Remove Router Interface Api | Network - Remove Router Interface |
| DELETE | `/api/v3/network/router/clear-gateway` | Clear Router Gateway Api | Network - Clear Router Gateway |
| POST | `/api/v3/network/floating-ip` | Create Floating Ip Api | Network - Create Floating IP |
| PUT | `/api/v3/network/floating-ip` | Update Floating Ip Api | Network - Update Floating IP |
| DELETE | `/api/v3/network/floating-ip` | Delete Floating Ip Api | Network - Delete Floating IP |
| GET | `/api/v3/network/floating-ip` | Get Floating Ip Api | Network - Get Floating IP |
| GET | `/api/v3/network/floating-ip/disassociate` | Disassociate Floating Ip Api | Network - Disassociate Floating IP |
| GET | `/api/v3/network/floating-ip/list` | List Floating Ip Api | Network - List Floating IPs |
| POST | `/api/v3/network/security-group` | Create Security Group Api | Network - Create Security Group |
| PUT | `/api/v3/network/security-group` | Update Security Group Api | Network - Update Security Group |
| DELETE | `/api/v3/network/security-group` | Delete Security Group Api | Network - Delete Security Group |
| GET | `/api/v3/network/security-group` | Get Security Group Api | Network - Get Security Group |
| GET | `/api/v3/network/security-group/list` | List Security Group Api | Network - List Security Groups |
| POST | `/api/v3/network/security-group-rule` | Create Security Group Rule Api | Network - Create Security Group Rule |
| DELETE | `/api/v3/network/security-group-rule` | Delete Security Group Rule Api | Network - Delete Security Group Rule |
| GET | `/api/v3/network/security-group-rule` | Get Security Group Rule Api | Network - Get Security Group Rule |
| GET | `/api/v3/network/security-group-rule/list` | List Security Group Rule Api | Network - List Security Group Rules |
| POST | `/api/v3/network/trunk` | Create Trunk Api | Network - Create Trunk |
| PUT | `/api/v3/network/trunk` | Update Trunk Api | Network - Update Trunk |
| DELETE | `/api/v3/network/trunk` | Delete Trunk Api | Network - Delete Trunk |
| GET | `/api/v3/network/trunk` | Get Trunk Api | Network - Get Trunk |
| GET | `/api/v3/network/trunk/list` | List Trunk Api | Network - List Trunks |
| POST | `/api/v3/network/qos-policy` | Create Qos Policy Api | Network - Create QoS Policy |
| PUT | `/api/v3/network/qos-policy` | Update Qos Policy Api | Network - Update QoS Policy |
| DELETE | `/api/v3/network/qos-policy` | Delete Qos Policy Api | Network - Delete QoS Policy |
| GET | `/api/v3/network/qos-policy` | Get Qos Policy Api | Network - Get QoS Policy |
| GET | `/api/v3/network/qos-policy/list` | List Qos Policy Api | Network - List QoS Policies |
| POST | `/api/v3/network/firewall-group` | Create Firewall Group Api | Network - Create Firewall Group |
| PUT | `/api/v3/network/firewall-group` | Update Firewall Group Api | Network - Update Firewall Group |
| DELETE | `/api/v3/network/firewall-group` | Delete Firewall Group Api | Network - Delete Firewall Group |
| GET | `/api/v3/network/firewall-group` | Get Firewall Group Api | Network - Get Firewall Group |
| GET | `/api/v3/network/firewall-group/list` | List Firewall Group Api | Network - List Firewall Groups |
| GET | `/api/v3/flavor/` | Get Flavor Api | List Flavors |
| GET | `/api/v3/keypair/` | Get Keypair Api | Get Keypair |
| POST | `/api/v3/keypair/` | Create Keypair Api | Create keypair |
| DELETE | `/api/v3/keypair/` | Delete Keypair Api | Delete Keypair |
| GET | `/api/v3/project/` | Get Project Api | List Projects |
| POST | `/api/v3/project/create` | Create Project Api | Create Project |
| GET | `/api/v3/image/` | Get Image Api | List images |
| GET | `/api/v3/volume/` | Get Volume Api | Volume - Get Volume |
| POST | `/api/v3/volume/` | Create Volume Api | Volume - Create Volume |
| DELETE | `/api/v3/volume/` | Delete Volume Api | Volume - Delete Volume |
| PUT | `/api/v3/volume/` | Update Volume Api | Volume - Update Volume |
| POST | `/api/v3/volume/attach` | Attach Volume Api | Volume - Attach Volume |
| POST | `/api/v3/volume/detach` | Detach Volume Api | Volume - Detach Volume |
| POST | `/api/v3/volume/extend` | Extend Volume Api | Volume - Extend Volume |
| GET | `/api/v3/volume/list` | List Volume Api | Volume - List Volume |
| GET | `/api/v3/volume/snapshot/list` | List Snapshot Api | Volume - List Snapshot |
| GET | `/api/v3/volume/snapshot` | Get Snapshot Api | Volume - Get Snapshot |
| POST | `/api/v3/volume/snapshot` | Create Snapshot Api | Volume - Create Snapshot |
| DELETE | `/api/v3/volume/snapshot` | Delete Snapshot Api | Volume - Delete Snapshot |
| GET | `/api/v3/volume/backup/list` | List Backup Api | Volume - List backup |
| GET | `/api/v3/volume/backup` | Get Backup Api | Volume - Get backup |
| POST | `/api/v3/volume/backup` | Create Backup Api | Volume - Create backup |
| DELETE | `/api/v3/volume/backup` | Delete Backup Api | Volume - Delete backup |
| POST | `/api/v3/volume/backup/restore` | Restore Backup Api | Volume - Restore backup |
| GET | `/api/v3/volume/availability_zone/list` | List Availability Zone Api | Volume - List availability_zone |
| GET | `/api/v3/volume/volume_type/list` | List Volume Type Api | Volume - List volume_type |
| GET | `/api/v3/volume/volume_type` | Get Volume Type Api | Volume - Get volume_type |
| POST | `/api/v3/volume/volume_type` | Create Volume Type Api | Volume - Create volume_type |
| DELETE | `/api/v3/volume/volume_type` | Delete Volume Type Api | Volume - Delete volume_type |
| GET | `/api/v3/volume/volume_transfer/list` | List Volume Transfer Api | Volume - List volume_transfer |
| GET | `/api/v3/volume/volume_transfer` | Get Volume Transfer Api | Volume - Get volume_transfer |
| POST | `/api/v3/volume/volume_transfer` | Create Volume Transfer Api | Volume - Create volume_transfer |
| DELETE | `/api/v3/volume/volume_transfer` | Delete Volume Transfer Api | Volume - Delete volume_transfer |
| POST | `/api/v3/volume/volume_transfer/accept` | Accept Volume Transfer Api | Volume - Create volume_transfer |
| GET | `/api/v3/volume/consistency_group/list` | List Consistency Group Api | Volume - List consistency_group |
| GET | `/api/v3/volume/consistency_group` | Get Consistency Group Api | Volume - Get consistency_group |
| POST | `/api/v3/volume/consistency_group` | Create Consistency Group Api | Volume - Create consistency_group |
| PUT | `/api/v3/volume/consistency_group` | Update Consistency Group Api | Volume - Update consistency_group |
| DELETE | `/api/v3/volume/consistency_group` | Delete Consistency Group Api | Volume - Delete consistency_group |
| GET | `/api/v3/volume/consistency_group/snapshot/list` | List Consistency Group Snapshot Api | Volume - List consistency_group_snapshot |
| GET | `/api/v3/volume/consistency_group/snapshot` | Get Consistency Group Snapshot Api | Volume - Get consistency_group_snapshot |
| POST | `/api/v3/volume/consistency_group/snapshot` | Create Consistency Group Snapshot Api | Volume - Create consistency_group_snapshot |
| DELETE | `/api/v3/volume/consistency_group/snapshot` | Delete Consistency Group Snapshot Api | Volume - Delete consistency_group_snapshot |
| GET | `/api/v3/fos/` | Get Fos Data Api | FOS Endpoints |
| GET | `/api/v3/fos/auth-details` | Get Fos Auth Details Api | FOS Endpoints |
| POST | `/api/v3/fos/container` | Create Container Api | FOS Endpoints |
| DELETE | `/api/v3/fos/container` | Delete Container Api | FOS Endpoints |
| GET | `/api/v3/fos/container` | List Container Api | FOS Endpoints |
| POST | `/api/v3/fos/container/upload` | Upload Object Api | FOS Endpoints |
| DELETE | `/api/v3/fos/container/object` | Delete Object Api | FOS Endpoints |
| GET | `/api/v3/fos/container/objects` | List Objects Api | FOS Endpoints |
| GET | `/api/v3/fos/container/object/download` | Download Object Api | FOS Endpoints |
| POST | `/api/v3/app-credentials` | Create App Credential Api | Create Application Credential |
| GET | `/api/v3/app-credentials` | List App Credentials Api | List Application Credentials |
| GET | `/api/v3/app-credentials/{application_credential_id}` | Get App Credential Api | Get Application Credential |
| DELETE | `/api/v3/app-credentials/{application_credential_id}` | Delete App Credential Api | Delete Application Credential |
| GET | `/api/v3/app-credentials/by-name/{name}` | Find App Credential By Name Api | Find Application Credential by Name |
