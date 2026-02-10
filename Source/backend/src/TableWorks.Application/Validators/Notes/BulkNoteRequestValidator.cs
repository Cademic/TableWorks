using FluentValidation;
using TableWorks.Application.DTOs.Notes;

namespace TableWorks.Application.Validators.Notes;

public sealed class BulkNoteRequestValidator : AbstractValidator<BulkNoteRequest>
{
    public BulkNoteRequestValidator()
    {
        RuleFor(x => x.NoteIds)
            .NotEmpty().WithMessage("At least one note ID is required.");

        RuleFor(x => x.Action)
            .NotEmpty().WithMessage("Action is required.")
            .Must(a => a is "delete" or "move" or "tag")
            .WithMessage("Action must be delete, move, or tag.");

        When(x => x.Action == "move", () =>
        {
            RuleFor(x => x.FolderId)
                .NotNull().WithMessage("FolderId is required for move action.");
        });

        When(x => x.Action == "tag", () =>
        {
            RuleFor(x => x.TagIds)
                .NotNull().WithMessage("TagIds is required for tag action.")
                .Must(t => t != null && t.Count > 0)
                .WithMessage("At least one tag ID is required for tag action.");
        });
    }
}
