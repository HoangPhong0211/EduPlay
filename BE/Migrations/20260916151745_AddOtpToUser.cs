using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AddOtpToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OtpCode",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OtpExpiryTime",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ErrorLogs_QuestionId",
                table: "ErrorLogs",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_ErrorLogs_StudentId",
                table: "ErrorLogs",
                column: "StudentId");

            migrationBuilder.AddForeignKey(
                name: "FK_ErrorLogs_Questions_QuestionId",
                table: "ErrorLogs",
                column: "QuestionId",
                principalTable: "Questions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ErrorLogs_Students_StudentId",
                table: "ErrorLogs",
                column: "StudentId",
                principalTable: "Students",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ErrorLogs_Questions_QuestionId",
                table: "ErrorLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_ErrorLogs_Students_StudentId",
                table: "ErrorLogs");

            migrationBuilder.DropIndex(
                name: "IX_ErrorLogs_QuestionId",
                table: "ErrorLogs");

            migrationBuilder.DropIndex(
                name: "IX_ErrorLogs_StudentId",
                table: "ErrorLogs");

            migrationBuilder.DropColumn(
                name: "OtpCode",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OtpExpiryTime",
                table: "Users");
        }
    }
}
