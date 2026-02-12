using AutoMapper;
using TableWorks.Application.DTOs.Admin;
using TableWorks.Application.DTOs.CalendarEvents;
using TableWorks.Application.DTOs.Folders;
using TableWorks.Application.DTOs.IndexCards;
using TableWorks.Application.DTOs.Notes;
using TableWorks.Application.DTOs.Notifications;
using TableWorks.Application.DTOs.Projects;
using TableWorks.Application.DTOs.Tags;
using TableWorks.Application.DTOs.Users;
using TableWorks.Core.Entities;

namespace TableWorks.Application.Mappings;

public sealed class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User -> DTOs
        CreateMap<User, UserProfileDto>();
        CreateMap<User, AdminUserDto>()
            .ForMember(d => d.Stats, opt => opt.MapFrom(s => new AdminUserStatsDto
            {
                NoteCount = s.Notes.Count,
                ProjectCount = s.OwnedProjects.Count
            }));

        // Note -> DTOs
        CreateMap<Note, NoteSummaryDto>()
            .ForMember(d => d.Tags, opt => opt.MapFrom(s =>
                s.NoteTags.Select(nt => new TagDto
                {
                    Id = nt.Tag!.Id,
                    Name = nt.Tag.Name,
                    Color = nt.Tag.Color
                })));

        CreateMap<Note, NoteDetailDto>()
            .ForMember(d => d.Tags, opt => opt.MapFrom(s =>
                s.NoteTags.Select(nt => new TagDto
                {
                    Id = nt.Tag!.Id,
                    Name = nt.Tag.Name,
                    Color = nt.Tag.Color
                })));

        CreateMap<Note, AdminNoteDto>()
            .ForMember(d => d.Username, opt => opt.MapFrom(s => s.User != null ? s.User.Username : string.Empty));

        // IndexCard -> DTOs
        CreateMap<IndexCard, IndexCardSummaryDto>()
            .ForMember(d => d.Tags, opt => opt.MapFrom(s =>
                s.IndexCardTags.Select(ct => new TagDto
                {
                    Id = ct.Tag!.Id,
                    Name = ct.Tag.Name,
                    Color = ct.Tag.Color
                })));

        CreateMap<IndexCard, IndexCardDetailDto>()
            .ForMember(d => d.Tags, opt => opt.MapFrom(s =>
                s.IndexCardTags.Select(ct => new TagDto
                {
                    Id = ct.Tag!.Id,
                    Name = ct.Tag.Name,
                    Color = ct.Tag.Color
                })));

        // Project -> DTOs
        CreateMap<Project, ProjectSummaryDto>()
            .ForMember(d => d.MemberCount, opt => opt.MapFrom(s => s.Members.Count));

        // ProjectMember -> DTO
        CreateMap<ProjectMember, ProjectMemberDto>()
            .ForMember(d => d.Username, opt => opt.MapFrom(s => s.User != null ? s.User.Username : string.Empty))
            .ForMember(d => d.Email, opt => opt.MapFrom(s => s.User != null ? s.User.Email : string.Empty));

        // Tag -> DTO
        CreateMap<Tag, TagDto>()
            .ForMember(d => d.NoteCount, opt => opt.MapFrom(s => s.NoteTags.Count));

        // Folder -> DTO
        CreateMap<Folder, FolderDto>()
            .ForMember(d => d.NoteCount, opt => opt.MapFrom(s => s.Notes.Count));

        // Notification -> DTO
        CreateMap<Notification, NotificationDto>();

        // AuditLog -> DTO
        CreateMap<AuditLog, AuditLogDto>()
            .ForMember(d => d.Details, opt => opt.MapFrom(s => s.DetailsJson));

        // UserPreferences -> DTO
        CreateMap<UserPreferences, UserPreferencesDto>()
            .ForMember(d => d.EmailNotifications, opt => opt.MapFrom(s => s.EmailNotificationsJson));

        // CalendarEvent -> DTO
        CreateMap<CalendarEvent, CalendarEventDto>();
    }
}
