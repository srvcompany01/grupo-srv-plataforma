# Rotas de dados do ClickUp (consolidadas)

Observadas ao abrir cada tela (método, caminho com ids normalizados, status e **forma** da resposta: campos e tipos, sem os valores). Serve para desenhar o nosso modelo de dados e as nossas rotas; não é uma cópia da API deles.

Total: 128 rotas únicas em 36 grupos. "telas" = em quantas telas a rota apareceu.


## data/v3  (20)

- `POST /data/v3/workspaces/:id/authentication/access_tokens` → 200 · 24 tela(s) · {token:string, expiration:number, refresh_token:null, attachment_token:string, refresh_token_metadata:{cookie_set:boolean, session:boolean}}
- `GET /data/v3/workspaces/:id/badging/badge_count` → 200 · 24 tela(s) · {badge_type:string, user_id:number, workspace_id:number, computed_date_ms:number, _v:number, chat:{user_id:number, workspace_id:number, computed_date_ms:number, trace_id:string, _v:number, unread_threads:{unread_count:number, badge_count:number, mention_count:number}, unread_rooms:{unread_count:number, badge_count:number, mention_count:number}, unread_posts:{unread_count:number
- `GET /data/v3/workspaces/:id/baselines/list/:id/config` → 200 · 1 tela(s) · {data:{baselines:[], custom_fields:[]}}
- `GET /data/v3/workspaces/:id/billing_usage/rules` → 200 · 24 tela(s) · {rules:[{workspace_id:string, rule_name:string, migrated:boolean, entitlement_type:string, restriction:{…}, grace_period_duration_seconds:null, effective_rule_limit:number, total_available_limit:number, effective_usage_left:number, previous_months_usage:number, reset_kind:string, plan_usage_month:number, plan_usage_lifetime:number, counter:{…}}]×40}
- `GET /data/v3/workspaces/:id/clips/creator` → 200 · 1 tela(s) · [{bucketId:number, id:string, parentId:string, date:string, signed:boolean, encrypted:boolean, extension:string, hidden:boolean, permanent:boolean, fileDeleted:boolean, deleted:boolean, size:number, orientation:null, url:string, userid:number, workspaceId:number, forTemplate:null, type:number}]×1
- `GET /data/v3/workspaces/:id/clips/creator/counts` → 200 · 1 tela(s) · {counters:{7:{total:number}, 8:{total:number}, 9:{total:number}, 10:{total:number}}}
- `GET /data/v3/workspaces/:id/clips/recent` → 200 · 24 tela(s) · [{bucketId:number, id:string, parentId:string, date:string, signed:boolean, encrypted:boolean, extension:string, hidden:boolean, permanent:boolean, fileDeleted:boolean, deleted:boolean, size:number, orientation:null, url:string, userid:number, workspaceId:number, forTemplate:null, type:number}]×1
- `GET /data/v3/workspaces/:id/emojis/suggested` → 200 · 24 tela(s) · [{name:string, url:string, updated_at:string}]×2
- `GET /data/v3/workspaces/:id/feature_entities/ai_skills` → 200 · 24 tela(s) · {list_id:string, space_id:string, folder_id:string, metadata:{space_id:string, folder_id:string, custom_fields:[{…}]×3}}
- `GET /data/v3/workspaces/:id/feature_entities/artifact_kits` → 200 · 24 tela(s) · {list_id:string, space_id:string, folder_id:string, metadata:{space_id:string, folder_id:string, custom_fields:[{…}]×4}}
- `GET /data/v3/workspaces/:id/guides` → 200 · 24 tela(s) · []
- `POST /data/v3/workspaces/:id/schedule_exceptions/bulk` → 201 · 1 tela(s) · {data:{exceptions:{36949648:user:49188670:[], 36949648:workspace:36949648:[]}}}
- `GET /data/v3/workspaces/:id/schedule_exceptions/reference/workspace/:id` → 200 · 4 tela(s) · {data:{id:string, exceptions:[], _version_vector:null}}
- `GET /data/v3/workspaces/:id/schedules/subjects/space/:id` → 404 · 3 tela(s) · {err:string, status:number, message:string, timestamp:string, error:string, statusCode:number}
- `GET /data/v3/workspaces/:id/schedules/subjects/user/:id` → 404 · 1 tela(s) · {err:string, status:number, message:string, timestamp:string, error:string, statusCode:number}
- `GET /data/v3/workspaces/:id/schedules/subjects/user/skeleton-user-0` → 404 · 1 tela(s) · {err:string, status:number, message:string, timestamp:string, error:string, statusCode:number}
- `GET /data/v3/workspaces/:id/time_allocations` → 200 · 1 tela(s) · []
- `GET /data/v3/workspaces/:id/user_sections/:id/sections` → 200 · 24 tela(s) · {sections:[{id:string, user_id:string, workspace_id:string, type:string, order_index:number, is_expanded:boolean, is_hidden:boolean, sorting:string, filtering:string, items:[{…}]×1}]×7, capabilities:[string]×10, server_time:number}
- `GET /data/v3/workspaces/:id/workweek_schedules/reference/user/:id` → 200 · 1 tela(s) · {data:{id:string, workweek:[{…}]×7, _version_vector:null}}
- `GET /data/v3/workspaces/:id/workweek_schedules/reference/workspace/:id` → 200 · 5 tela(s) · {data:{id:string, workweek:[{…}]×7, _version_vector:null}}

## docs/v1  (13)

- `GET /docs/v1/codoxAccessToken` → 200 · 2 tela(s) · {accessToken:string, access:string, version:string}
- `GET /docs/v1/document/137kmg-:n/tag` → 200 · 1 tela(s) · []
- `GET /docs/v1/document/tag` → 200 · 2 tela(s) · {pageInfo:{hasNextPage:boolean, endCursor:null}, documentTags:[{id:string, team_id:number, name:string, color_bg:string, color_fg:string, private:boolean, popularity:number}]×1}
- `GET /docs/v1/genericLinks/page/137kmg-:n/externalLinks` → 200 · 1 tela(s) · {external_links:[], next_cursor:string}
- `GET /docs/v1/genericLinks/page/137kmg-:n/links` → 200 · 1 tela(s) · {generic_links:[], next_cursor:string}
- `GET /docs/v1/genericLinks/view/137kmg-:n/backLinks` → 200 · 1 tela(s) · {backlinks:[], next_cursor:string}
- `GET /docs/v1/genericLinks/view/137kmg-:n/externalLinks` → 200 · 1 tela(s) · {external_links:[], next_cursor:string}
- `GET /docs/v1/genericLinks/view/137kmg-:n/links` → 200 · 1 tela(s) · {generic_links:[], next_cursor:string}
- `POST /docs/v1/team/:id/docs/bulk` → 200 · 2 tela(s) · {docs:[{object_id:string, status:string, data:{…}}]×1}
- `POST /docs/v1/team/:id/docs/search` → 200 · 1 tela(s) · {ids:[string]×20, nextCursor:string}
- `GET /docs/v1/view/137kmg-:n/page` → 200 · 1 tela(s) · {pages:[{id:string, archived:boolean, view_id:string, parent:null, name:string, subtitle:null, text_content:string, color:null, cover_image_url:null, cover_image_color:null, cover_position_x:null, cover_position_y:null, thumbnail_s3_key:null, creator:number, deleted:boolean, date_created:string, date_updated:string, date_deleted:null}]×1, last_page:string, _version_vector:{work
- `GET /docs/v1/view/137kmg-:n/page/137kmg-:n` → 200 · 1 tela(s) · {id:string, view_id:string, parent:null, name:string, content:string, color:null, thumbnail_s3_key:null, creator:number, deleted:boolean, date_created:string, date_updated:string, date_deleted:null, orderindex:number, public:boolean, seo_optimized:boolean, text_content:string, editor_token:string, deleted_by:null}
- `GET /docs/v1/view/137kmg-:n/page/count` → 200 · 1 tela(s) · string

## hierarchy/v1  (10)

- `GET /hierarchy/v1/category/:id` → 200 · 10 tela(s) · {id:string, name:string, date_updated:string, deleted:boolean, orderindex:number, content:string, color:null, due_date:null, due_date_time:boolean, archived:boolean, project_id:string, hidden:boolean, sprint:null, private:boolean, override_statuses:boolean, permanent_template_id:null, status:null, owner:number}
- `GET /hierarchy/v1/project` → 200 · 24 tela(s) · [{id:string, team:{id:string, owner:{…}, using_github:boolean, using_gitlab:null, using_bitbucket:null, name:string, date_created:string, avatar:null}, date_created:string, orderindex:number, date_deleted:null, due_date:null, storage_used:string, date_updated:string, start_date:null, owner:{id:number, username:string, email:string, color:string, initials:string, profilePicture:
- `GET /hierarchy/v1/project/:id` → 200 · 1 tela(s) · {id:string, team:{id:string, name:string, date_created:string, using_github:boolean, using_gitlab:null, using_bitbucket:null}, date_created:string, orderindex:number, date_deleted:null, due_date:null, storage_used:string, date_updated:string, start_date:null, owner:{id:number, username:string, email:string, color:string, initials:string, profilePicture:string}, creator:number, 
- `GET /hierarchy/v1/project/:id/all_statuses` → 200 · 11 tela(s) · {statuses:[{id:string, status:string, type:string, colors:[string]×1, subcategory_ids:[string]×11, status_ids_in_group:[string]×1, color:string}]×6}
- `GET /hierarchy/v1/project/:id/category` → 200 · 11 tela(s) · {categories:[{id:string, name:string, orderindex:number, content:string, color:null, due_date:null, due_date_time:boolean, archived:boolean, private:boolean, owner:number, project_id:string, override_statuses:boolean, hidden:boolean, sprint:null, status:null, date_created:string, parent_id:string, parent_type:number}]×12, base_permissions_data:{base_category_permissions_set:{ca
- `GET /hierarchy/v1/subcategory/:id` → 200 · 11 tela(s) · {id:string, name:string, personal_list:boolean, orderindex:number, content:string, color:null, status_name:null, avatar:null, custom_items_default:null, due_date:null, date_updated:string, due_date_time:boolean, start_date:null, start_date_time:null, archived:boolean, hide_description:null, deleted:boolean, category:string}
- `GET /hierarchy/v1/team/:id/personalListHierarchy` → 200 · 24 tela(s) · {project:{id:string, team:{id:string, name:string, date_created:string, using_github:boolean, using_gitlab:null, using_bitbucket:null}, date_created:string, orderindex:number, date_deleted:null, due_date:null, storage_used:string, date_updated:string, start_date:null, owner:{id:number, username:string, email:string, color:string, initials:string, profilePicture:string}, creator
- `GET /hierarchy/v1/team/:id/projectFeatures` → 200 · 24 tela(s) · {projects:[{id:string, default_category:null, default_preset_view:number, preset_views:[number]×2, features:{…}}]×11}
- `GET /hierarchy/v1/team/:id/shared` → 200 · 1 tela(s) · {categories:{categories:[]}, subcategories:{subcategory_list:[]}, taskCount:number, taskMembers:[], views:{views:[], standard_views:{board:null, list:null, calendar:null, gantt_type:null, box:null, activity:null, timeline:null, workload:null, mind_map:null, table:null, map:null, dashboard:null}, default_view:null, has_canonical_channel:null, groups:[], last_page:boolean, paging
- `GET /hierarchy/v1/team/:id/tray` → 200 · 24 tela(s) · []

## comment-service/v3  (9)

- `GET /comment-service/v3/workspaces/:id/comments/doc/137kmg-:n` → 200 · 1 tela(s) · {comments:[], comment_threads:[]}
- `GET /comment-service/v3/workspaces/:id/comments/last_read_at/delta/:id` → 200 · 24 tela(s) · {comments_last_read_at:[]}
- `POST /comment-service/v3/workspaces/:id/comments/last_read_at/search_threads` → 200 · 24 tela(s) · []
- `POST /comment-service/v3/workspaces/:id/comments/parents/bulk` → 200 · 24 tela(s) · {comment_parents:[{object_id:string, object_type:string, status:string, data:{…}}]×2, comment_threads:[]}
- `POST /comment-service/v3/workspaces/:id/comments/search` → 200 · 15 tela(s) · {comments:[], comment_threads:[]}
- `GET /comment-service/v3/workspaces/:id/comments/types/post/subtypes` → 200 · 1 tela(s) · {comment_subtypes:[{id:string, name:string}]×4}
- `GET /comment-service/v3/workspaces/:id/comments/view/137kmg-:n` → 200 · 2 tela(s) · {comments:[], comment_threads:[]}
- `GET /comment-service/v3/workspaces/:id/comments/view/7-:id` → 200 · 1 tela(s) · {comments:[{id:string, date:string, parent:string, type:number, source:null, x:null, y:null, image_y:null, image_x:null, page:null, comment_number:null, comment_time:null, group_assignee:null, userid:number, resolved:boolean, resolved_by:null, assignee:null, assigned_by:null}]×2, comment_threads:[]}
- `POST /comment-service/v3/workspaces/:id/scheduled-comments/search` → 201 · 24 tela(s) · []

## entitlements/v1  (9)

- `GET /entitlements/v1/team/:id/entitlements` → 200 · 4 tela(s) · {activity_view:{type:string, entitled:boolean, limit:number, dataIsComplete:boolean}, agent_audit_logs:{type:string, entitled:boolean, limit:string, dataIsComplete:boolean}, agent_rate_limit_15min:{type:string, entitled:boolean, limit:number, dataIsComplete:boolean}, agent_rate_limit_5min:{type:string, entitled:boolean, limit:number, dataIsComplete:boolean}, agent_rate_limit_da
- `GET /entitlements/v1/team/:id/entitlements/aggregated_auto_ai` → 200 · 24 tela(s) · {type:string, entitled:boolean, limit:number, usageLeft:number, usage:number, previousMonthsUsage:number, counterYearMonth:string, counterBucketId:string, counterWindowStart:string, counterWindowEnd:string, resetKind:string, planLimits:number, aiCreditsBreakdown:{perUserCredits:number, billedUsers:number, addonIncludedCredits:number, bonusCredits:number, bonusCreditsExpiry:null
- `GET /entitlements/v1/team/:id/entitlements/bulk` → 200 · 24 tela(s) · {aggregated_auto_ai:{type:string, entitled:boolean, limit:number, usageLeft:number, usage:number, previousMonthsUsage:number, counterYearMonth:string, counterBucketId:string, counterWindowStart:string, counterWindowEnd:string, resetKind:string, planLimits:number, aiCreditsBreakdown:{perUserCredits:number, billedUsers:number, addonIncludedCredits:number, bonusCredits:number, bon
- `GET /entitlements/v1/team/:id/entitlements/map_view` → 200 · 1 tela(s) · {type:string, entitled:boolean, planLimits:number, limit:number, usage:number, usageLeft:number}
- `GET /entitlements/v1/team/:id/entitlements/plans` → 200 · 4 tela(s) · {activity_view:{1:{planId:number, nextAvailable:[number]×5, entitled:boolean, type:string, limit:number, nextUpgrade:number, topUpgrade:number}, 18:{planId:number, nextAvailable:[number]×4, entitled:boolean, type:string, limit:number, nextUpgrade:number, topUpgrade:number}, 19:{planId:number, nextAvailable:[number]×3, entitled:boolean, type:string, limit:string}, 20:{planId:num
- `GET /entitlements/v1/team/:id/entitlements/recurring_ai_meeting_bot` → 200 · 23 tela(s) · {type:string, entitled:boolean, limit:number, usageLeft:number, usage:number, counterYearMonth:string, counterBucketId:string, counterWindowStart:string, counterWindowEnd:string, resetKind:string, planLimits:number, planUsageMonth:number, planUsageLifetime:number}
- `GET /entitlements/v1/team/:id/entitlements/scheduled_reports` → 200 · 22 tela(s) · {type:string, entitled:boolean, planLimits:number, limit:number, usage:number, usageLeft:number}
- `GET /entitlements/v1/team/:id/entitlements/timeline_view` → 200 · 1 tela(s) · {type:string, entitled:boolean, planLimits:number, limit:number, usage:number, usageLeft:number}
- `GET /entitlements/v1/team/:id/entitlements/workload_view` → 200 · 1 tela(s) · {type:string, entitled:boolean, planLimits:number, limit:number, usage:number, usageLeft:number}

## user/v1  (9)

- `GET /user/v1/sessionSettings/user` → 200 · 24 tela(s) · {userid:number}
- `GET /user/v1/team/:id/customRoles` → 200 · 24 tela(s) · {custom_roles:[]}
- `GET /user/v1/team/:id/group` → 200 · 24 tela(s) · {groups:[]}
- `GET /user/v1/team/:id/member` → 200 · 24 tela(s) · {members:[{user:{…}, twofa_enabled:string, twofa_totp_enabled:boolean, twofa_text_enabled:boolean, invite:boolean, role:number, role_subtype:number, role_key:string, role_permissions:{…}, last_active:string, date_joined:string, date_invited:string, auto_send_invoices:boolean, can_see_time_spent:null, can_see_time_estimated:null, can_see_points_estimated:null, can_create_views:b
- `GET /user/v1/team/:id/profile/:id` → 200 · 24 tela(s) · {user:{id:number, username:string, description:null, email:string, color:string, initials:string, profilePicture:string, date_joined:string, timezone:string}, memberInfo:{role:number, role_subtype:number, date_joined:string, date_invited:string, invite:boolean, description:string, manager:null}, profileInfo:{display_profile:boolean, verified_ambassador:null, verified_consultant
- `GET /user/v1/team/:id/rolePermissionSettings` → 200 · 24 tela(s) · {settings:[{role:string, role_subtype:number, add_email_account:number, can_connect_private_mcp:number, can_connect_shared_mcp:number, can_connect_private_integrations:number, can_convert_item:number, can_convert_milestone:number, can_create_agents:number, can_create_ai_skills:number, can_download_chat_export:number, can_edit_user_groups:number, can_export_chat:number, can_send
- `GET /user/v1/team/:id/user/online` → 200 · 24 tela(s) · [{userid:number, presence:{status:number, last_online:null}}]×1
- `GET /user/v1/team/:id/user/weights` → 200 · 24 tela(s) · {}
- `GET /user/v1/user` → 200 · 24 tela(s) · {email_validated:boolean, phone_validated:boolean, user:{id:number, username:string, given_name:null, family_name:null, email:string, hmac:string, chameleon_uid:string, chameleon_uid_hash:string, phone:null, description:null, color:string, initials:string, date_joined:string, joined:boolean, invited_by:[], profilePicture:string, profileInfo:{verified_consultant:null, top_tier_u

## v3-user/access  (7)

- `POST /v3-user/access/:id/list/acls/bulk` → 200 · 10 tela(s) · {acls:[{object_id:string, object_type:string, status:string, data:{…}}]×1}
- `POST /v3-user/access/:id/space/acls/bulk` → 200 · 1 tela(s) · {acls:[{object_id:string, object_type:string, status:string, data:{…}}]×1}
- `GET /v3-user/access/:id/task/17tnw2ba7ya/requests` → 200 · 1 tela(s) · {requests:[]}
- `POST /v3-user/access/:id/task/acls/bulk` → 200 · 1 tela(s) · {acls:[{object_id:string, object_type:string, status:string, data:{…}}]×2}
- `GET /v3-user/access/:id/view/137kmg-:n/requests` → 200 · 1 tela(s) · {requests:[]}
- `POST /v3-user/access/:id/view/acls/bulk` → 200 · 13 tela(s) · {acls:[{object_id:string, object_type:string, status:string, data:{…}}]×2}
- `POST /v3-user/access/authz/:id/permissions/bulk` → 200 · 24 tela(s) · {object_permissions:[{object_id:string, object_type:string, workspace_id:number, status:string, data:{…}}]×1}

## hierarchy/v3  (4)

- `GET /hierarchy/v3/experience/sidebar/workspaces/:id/shared` → 200 · 24 tela(s) · {workspace_id:string, categories:[], subcategories:[], taskCount:number}
- `GET /hierarchy/v3/experience/sidebar/workspaces/:id/tree` → 200 · 24 tela(s) · {workspace_id:number, projects:[{id:string, name:string, orderindex:number, color:string, categories:[{…}]×1}]×7, _version_vector:{workspace_id:number, object_type:string, object_id:string, vector:[{…}]×5}, versions:[], _defaults:{space:{archived:boolean, private:boolean, hidden:null, sprint:null, parent_id:null, parent_type:null, color:null}, folder:{archived:boolean, private:
- `GET /hierarchy/v3/experience/sidebar/workspaces/:id/views` → 200 · 24 tela(s) · {workspace_id:string, views:[{view_id:string, creator:number, name:string, visibility:number, default:boolean, team_id:string, deleted:boolean, public:boolean, parent_id:string, view_entity_type:number, sidebar_num_subcats_between:number, archived:boolean, share_with_team:boolean, type:number, parent_type:number, orderindex:number, permission_level:number, id:string}]×3}
- `GET /hierarchy/v3/experience/workspaces/:id` → 200 · 24 tela(s) · {workspace_id:string, locationStatuses:[{status:string, color:string, orderindex:number, hide_label:boolean}]×12}

## scheduling/v1  (4)

- `GET /scheduling/v1/holiday/countries` → 400 · 1 tela(s) · {err:string, ECODE:string}
- `GET /scheduling/v1/team/:id/time_entries/current` → 200 · 24 tela(s) · {data:null}
- `GET /scheduling/v1/team/:id/time_entries/tags` → 200 · 1 tela(s) · {data:[]}
- `POST /scheduling/v1/team/:id/user/capacity` → 200 · 1 tela(s) · [{userid:number, capacity:{time_estimate:{…}, points:{…}, tasks:{…}}, skip_weekends:boolean, entitled:boolean}]×1

## viz/v1  (4)

- `GET /viz/v1/default_views` → 200 · 1 tela(s) · {views:[{date_created:string, parent_id_bigint:null, team_id:string, date_deleted:null, date_frozen:null, frozen_by:{…}, visible_to:null, template_visible_to:string, date_updated:string, public_share_expires_on:null, made_public_by:null, made_public_time:null, date_archived:null, creator:number, type:number, orderindex:number, visibility:number, template_visibility:null}]×1, st
- `GET /viz/v1/team/:id/static-widget-views/my-tasks` → 200 · 1 tela(s) · {view:{date_created:string, parent_id_bigint:null, team_id:string, date_deleted:null, date_frozen:null, frozen_by:{id:number, username:null, email:null, color:null, initials:null, profilePicture:null}, visible_to:string, template_visible_to:string, date_updated:string, public_share_expires_on:null, made_public_by:null, made_public_time:null, date_archived:null, creator:number, 
- `GET /viz/v1/view` → 200 · 11 tela(s) · {views:[{date_created:string, parent_id_bigint:null, team_id:string, date_deleted:null, date_frozen:null, frozen_by:{…}, visible_to:null, template_visible_to:string, date_updated:string, public_share_expires_on:null, made_public_by:null, made_public_time:null, date_archived:null, creator:number, type:number, orderindex:number, visibility:number, template_visibility:null}]×8, st
- `GET /viz/v1/view/137kmg-:n` → 200 · 10 tela(s) · {view:{date_created:string, parent_id_bigint:null, team_id:string, date_deleted:null, date_frozen:null, frozen_by:{id:number, username:null, email:null, color:null, initials:null, profilePicture:null}, visible_to:null, template_visible_to:string, date_updated:string, public_share_expires_on:null, made_public_by:null, made_public_time:null, date_archived:null, creator:number, ty

## chat/v1  (3)

- `POST /chat/v1/workspaces/:id/chat/rooms/canonical/bulk` → 200 · 9 tela(s) · {rooms:[{status:string, key:{…}}]×1, __typename:string}
- `GET /chat/v1/workspaces/:id/chat/rooms/delta/:id` → 200 · 24 tela(s) · {rooms:[{status:string, data:{…}, object_id:string}]×1, __typename:string}
- `GET /chat/v1/workspaces/:id/chat/settings` → 200 · 24 tela(s) · {sidebar_style:string, emoji_skin_tone:string, max_dms_in_sidebar:number, show_sidebar_labels:boolean, __typename:string}

## tasks/v1  (3)

- `GET /tasks/v1/:id/customItems` → 200 · 24 tela(s) · {custom_items:[{id:number, name:string, description:null, avatar:{…}, created_by:{…}, date_created:null, team_id:null}]×12}
- `GET /tasks/v1/tag` → 200 · 11 tela(s) · {tags:[{name:string, project_id:string, tag_fg:string, tag_bg:string, creator:number}]×1, last_page:boolean}
- `GET /tasks/v1/task/17tnw2ba7ya/historyItems` → 200 · 1 tela(s) · {history:[{id:string, type:number, date:string, field:string, parent_id:string, data:{…}, source:null, user:{…}, task_id:string, before:{…}, after:{…}}]×2, _version_vector:{workspace_id:number, object_type:string, object_id:string, vector:[{…}]×1}}

## customFields/v2  (2)

- `GET /customFields/v2/field` → 200 · 13 tela(s) · {fields:{team:[], project:[{…}]×2, category:[], subcategory:[{…}]×1}}
- `GET /customFields/v2/team/:id/fields/taskStatuses` → 200 · 24 tela(s) · {all_statuses:[{status_id:string, status:string, type:string, colors:[string]×1}]×15}

## emails/v1  (2)

- `GET /emails/v1/team/:id/email` → 200 · 1 tela(s) · {accounts:[]}
- `GET /emails/v1/team/:id/signature` → 200 · 1 tela(s) · {signatures:[]}

## inbox/v3  (2)

- `POST /inbox/v3/workspaces/:id/notifications/bundles/search` → 200 · 1 tela(s) · {resources:[{name:string, status:{…}, location:{…}, isSubtask:boolean, customType:null, locations:[string]×1, id:string, type:string, entityResourceName:string}]×8, notificationBundleGroups:[{type:string, notificationBundles:[{…}]×8}]×1, users:{}}
- `POST /inbox/v3/workspaces/:id/notifications/bundles/stats/fetch` → 200 · 24 tela(s) · {lastUpdatedAt:string, allWorkspaces:{36949648:number, 9013092453:number}, activityCount:number, messagesCount:number, savedCount:number, reminderCount:number, laterCount:number}

## notification/v2  (2)

- `GET /notification/v2/browserEnabledGlobally` → 200 · 24 tela(s) · {browser_enabled_globally:boolean, desktop_enabled_globally:boolean}
- `GET /notification/v2/team/:id/notificationSettings` → 200 · 24 tela(s) · {settings:[{userid:string, team:string, field:string, email_enabled:number, email_my_tasks:null, mobile_push:number, mobile_push_my_tasks:null, mobile_push_sound:number, web_app:number, web_app_my_tasks:null, browser_enabled:number, browser_my_tasks:null, minutes_after:null, time_of_day_hour:null, time_of_day_minute:null, desktop_enabled:number, desktop_my_tasks:null, time_of_d

## plan/v2  (2)

- `GET /plan/v2/team/:id/plan` → 200 · 24 tela(s) · {planId:number, planTier:string, billedPlanId:number, trialPlanId:null, trialU2305PlanId:null, trialPlanTier:null, trialStart:null, availablePlanTiers:{FreeForever:number, Unlimited:number, Business:number, BusinessPlus:number, Enterprise:number, Max:number}, availablePlanTiersNoTrial:{FreeForever:number, Unlimited:number, Business:number, BusinessPlus:number, Enterprise:number
- `GET /plan/v2/team/:id/pricing` → 200 · 24 tela(s) · {plan_info:{id:string, name:string, price:number, price_per_user:number, price_per_user_monthly:number, price_per_user_yearly:number, cycles:string, cycles_next_cycle:null, storage:number, storage_per_user:number, next_bill_date:string, users:number, free_seats:number, default_payment_token:string, service_status:number, payment_failed:boolean, credit:number, addUser:number}, b

## team/v1  (2)

- `GET /team/v1/team/:id` → 200 · 24 tela(s) · {id:string, owner:{id:number, username:string, email:string, color:string, initials:string, profilePicture:string}, name:string, date_created:string, billed_users_this_cycle:number, color:string, color_theme:null, setup_step:string, hours_per_day:null, service_status:number, next_renewal_retry_date:null, next_rollup_retry_date:null, grace_period_end:null, rollup_grace_period_en
- `PUT /team/v1/team/:id` → 200 · 2 tela(s) · {id:string, owner:{id:number, username:string, email:string, color:string, initials:string, profilePicture:string}, name:string, date_created:string, billed_users_this_cycle:number, color:string, color_theme:null, setup_step:string, hours_per_day:null, service_status:number, next_renewal_retry_date:null, next_rollup_retry_date:null, grace_period_end:null, rollup_grace_period_en

## ui/v3  (2)

- `GET /ui/v3/workspaces/:id/docs/counts` → 200 · 1 tela(s) · {counters:{all:number, my_docs:number, shared:number, private:number, meeting_notes:number}}
- `POST /ui/v3/workspaces/:id/subtasks/tree/bulk` → 200 · 1 tela(s) · {trees:[{id:string, subtasks:[], archived:boolean, closed:boolean, deleted:boolean}]×1}

## v3-user/experience  (2)

- `GET /v3-user/experience/:id/users` → 200 · 24 tela(s) · {workspace_users:[{object_id:string, status:string, data:{…}}]×1}
- `POST /v3-user/experience/:id/users/bulk` → 200 · 1 tela(s) · {workspace_users:[{object_id:string, status:string}]×1}

## view/v1  (2)

- `POST /view/v1/activity` → 200 · 1 tela(s) · {activity:[{id:string, date:string, task_id:string, hist_item:{…}}]×1, has_more:boolean, paging:{start_hist_id:string, start_hist_date:string}, pay_wall:boolean}
- `POST /view/v1/genericView` → 200 · 23 tela(s) · {gantt:{view_obj:boolean, groups:[{…}]×1}, tasks:[], team_id:string, last_page:boolean, overall_calculations:[], permissions:{can_read:boolean, act_on_others_trash:boolean, add_email_account:boolean, add_followers:boolean, assign_any_role:boolean, assign_custom_roles:boolean, billing:boolean, can_access_entitlements_usage:boolean, can_add_team_admins:boolean, can_add_team_guest

## auth/v1  (1)

- `POST /auth/v1/refresh_token` → 200 · 24 tela(s) · {token:string, expiration:number, refresh_token:null, attachment_token:string, access_token_metadata:{cookie_set:boolean, expiration:string}, refresh_token_metadata:{cookie_set:boolean, session:boolean}}

## customFields/v1  (1)

- `GET /customFields/v1/team/:id/fields` → 200 · 24 tela(s) · {fields:[{id:string, name:string, type:string, type_config:{…}, userid:string, date_created:string, hide_from_guests:boolean, team_id:string, deleted:boolean, date_deleted:null, required:boolean, required_on_subtasks:boolean, private:boolean, pinned:boolean, default_value:null, subcategories:[{…}]×1}]×20}

## field/v3  (1)

- `POST /field/v3/experience/workspaces/:id/field/jobs/search` → 201 · 23 tela(s) · {jobs:[], nextCursor:string}

## goals/v1  (1)

- `GET /goals/v1/team/:id/goal` → 200 · 23 tela(s) · {goals:[], folders:[]}

## payment/v1  (1)

- `GET /payment/v1/team/:id/guestInfo` → 200 · 24 tela(s) · {cost_of_seat_monthly:number, cycles:string, guests:number, members:number, allowed_guests:string, total_seats:number, guests_per_seat:number, trial:boolean, hasPendingRollup:boolean}

## plan/v1  (1)

- `GET /plan/v1/team/:id/trialAvailability` → 200 · 24 tela(s) · {availability:{FreeForever:boolean, Unlimited:boolean, Business:boolean, BusinessPlus:boolean, Enterprise:boolean, Max:boolean}}

## shard/v1  (1)

- `GET /shard/v1/handshake/:id` → 200 · 24 tela(s) · {workspaceId:string, shardId:string, appEnvironment:{attachmentUrl:string, apiUrl:string, apiUrlV2:string, apiUrlDoc:string, apiUrlAiService:string, apiUrlBase:string, websocketUrl:string, publicShareUrl:string, publicDocsUrl:string, publicFormsUrl:string, invoiceUrl:string, formApiUrlBase:string, formApiUrl:string, exportUrl:string, ganttExportUrl:string, oauthCallbackUrl:stri

## taskStatus/v1  (1)

- `GET /taskStatus/v1/timlStatus` → 200 · 11 tela(s) · {statuses:[]}

## tasks/v2  (1)

- `POST /tasks/v2/task` → 200 · 3 tela(s) · {tasks:[{draft_uuid:null, recur_settings:null, duration:null, date_created:string, date_updated:string, subcategory:{…}, date_deleted:null, due_date:null, start_date:null, time_estimate:null, date_closed:null, recur_until:null, recur_tz_offset:null, date_done:null, date_delegated:null, default_category_id:null, made_public_by:null, made_public_time:null}]×1}

## templates/v2  (1)

- `GET /templates/v2/taskTemplate` → 200 · 1 tela(s) · {templates:[{id:string, original_id:string, name:string, description:null, counts:{…}, public_sharing:boolean, template_visibility:number, date_updated:string, date_created:string, custom_type:null, options:{…}, date_used:string, due_date:null, version:number, template_id:string, used_count:number, last_used:string, template_members:[]}]×4, last_page:boolean, paging:{}, full_co

## userWebhook/v1  (1)

- `GET /userWebhook/v1/ip` → 200 · 24 tela(s) · {ip:string, country_code:string, country_name:string, currency:{code:string, number:string, digits:number, currency:string, countries:[string]×1, name:string}, city:string, region_code:string, region_name:string, continent_code:string}

## v1/i  (1)

- `POST /v1/i` → 200 · 24 tela(s) · {success:boolean}

## v1/projects  (1)

- `GET /v1/projects/plViNAfpbYhPPnw0NQgcdYWMJU0zLMqz/settings` → 200 · 24 tela(s) · {_lastModified:string, integrations:{Actions Amplitude:{versionSettings:{…}, consentSettings:{…}}, Google Tag Manager:{containerId:string, dataLayerName:string, environment:string, trackAllPages:boolean, trackCategorizedPages:boolean, trackNamedPages:boolean, versionSettings:{…}, type:string, consentSettings:{…}, bundlingStatus:string}, Iterable:{trackAllPages:boolean, trackCat

## v1/t  (1)

- `POST /v1/t` → 200 · 24 tela(s) · {success:boolean}

## v2/sd  (1)

- `GET /v2/sd/team/:id/access-token` → 200 · 24 tela(s) · {origin:string, accessToken:string, expiresIn:number}
