using Microsoft.EntityFrameworkCore;
using TableWorks.Core.Entities;

namespace TableWorks.Infrastructure.Data;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<NoteTag> NoteTags => Set<NoteTag>();
    public DbSet<Folder> Folders => Set<Folder>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<UserPreferences> UserPreferences => Set<UserPreferences>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.Email).IsUnique();
            entity.HasIndex(x => x.Username).IsUnique();
        });

        modelBuilder.Entity<Note>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasOne(x => x.User)
                .WithMany(x => x.Notes)
                .HasForeignKey(x => x.UserId);
            entity.HasOne(x => x.Folder)
                .WithMany(x => x.Notes)
                .HasForeignKey(x => x.FolderId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(x => x.Project)
                .WithMany(x => x.Notes)
                .HasForeignKey(x => x.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasOne(x => x.Owner)
                .WithMany(x => x.OwnedProjects)
                .HasForeignKey(x => x.OwnerId);
        });

        modelBuilder.Entity<ProjectMember>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.ProjectId, x.UserId }).IsUnique();
            entity.HasOne(x => x.Project)
                .WithMany(x => x.Members)
                .HasForeignKey(x => x.ProjectId);
            entity.HasOne(x => x.User)
                .WithMany(x => x.ProjectMemberships)
                .HasForeignKey(x => x.UserId);
        });

        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<NoteTag>(entity =>
        {
            entity.HasKey(x => new { x.NoteId, x.TagId });
            entity.HasOne(x => x.Note)
                .WithMany(x => x.NoteTags)
                .HasForeignKey(x => x.NoteId);
            entity.HasOne(x => x.Tag)
                .WithMany(x => x.NoteTags)
                .HasForeignKey(x => x.TagId);
        });

        modelBuilder.Entity<Folder>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasOne(x => x.User)
                .WithMany(x => x.Folders)
                .HasForeignKey(x => x.UserId);
            entity.HasOne(x => x.ParentFolder)
                .WithMany(x => x.ChildFolders)
                .HasForeignKey(x => x.ParentFolderId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasOne(x => x.User)
                .WithMany(x => x.Notifications)
                .HasForeignKey(x => x.UserId);
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasOne(x => x.User)
                .WithMany(x => x.AuditLogs)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<UserPreferences>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.UserId).IsUnique();
            entity.HasOne(x => x.User)
                .WithOne(x => x.Preferences)
                .HasForeignKey<UserPreferences>(x => x.UserId);
        });
    }
}
